package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/gin-gonic/gin"
	v1 "github.com/opencontainers/image-spec/specs-go/v1"
)

type RunRequest struct {
	ContainerName string
	Config        container.Config
	HostConfig    container.HostConfig
	NetworkConfig network.NetworkingConfig
	platform      *v1.Platform
}

type RmRequest struct {
	Options container.RemoveOptions
}

type PullRequest struct {
	ImageName string
	Options   image.PullOptions
}

type ContainerListRequest struct {
	Options container.ListOptions
}

type ImageListRequest struct {
	Options image.ListOptions
}

type StartRequest struct {
	Options container.StartOptions
}

type StopRequest struct {
	Options container.StopOptions
}

type LogsRequest struct {
	Options container.LogsOptions
}

type EventsRequest struct {
	Options events.ListOptions
}

type ExecRequest struct {
	Command string `json:"command"`
}

type ContainerCreateRequest struct {
	Name    string        `json:"name" binding:"required"`
	Image   string        `json:"image" binding:"required"`
	Ports   []PortMapping `json:"ports"`
	Env     []string      `json:"env"`
	Memory  int64         `json:"memory" binding:"gte=0"`
	CPU     float64       `json:"cpu" binding:"gte=0"`
	Command []string      `json:"command"`
	Restart string        `json:"restart" binding:"oneof=no on-failure always unless-stopped"`
	Volumes []string      `json:"volumes"`
}

type PortMapping struct {
	HostPort      uint16 `json:"hostPort" binding:"required,gt=0"`
	ContainerPort uint16 `json:"containerPort" binding:"required,gt=0"`
	Protocol      string `json:"protocol" binding:"oneof=tcp udp"`
}

func (r *ContainerCreateRequest) ToDockerConfig() (*container.Config, *container.HostConfig, error) {
	// Create port bindings and exposed ports
	portBindings := make(map[nat.Port][]nat.PortBinding)
	exposedPorts := make(map[nat.Port]struct{})

	for _, port := range r.Ports {
		// Format: port/protocol
		containerPort := nat.Port(fmt.Sprintf("%d/%s", port.ContainerPort, strings.ToLower(port.Protocol)))

		// Add to exposed ports
		exposedPorts[containerPort] = struct{}{}

		// Add to port bindings
		portBindings[containerPort] = []nat.PortBinding{
			{
				HostPort: fmt.Sprintf("%d", port.HostPort),
				// Bind to all interfaces
				HostIP: "",
			},
		}
	}

	// Create volume bindings
	var volumes map[string]struct{}
	var binds []string
	if len(r.Volumes) > 0 {
		volumes = make(map[string]struct{})
		for _, volume := range r.Volumes {
			// Create the host path as /gsm/shared/<container_name>/<path>
			hostPath := filepath.Join("/gsm/shared", r.Name, volume)
			// Use the original path as container path
			containerPath := filepath.Join("/", volume)

			volumes[containerPath] = struct{}{}
			binds = append(binds, fmt.Sprintf("%s:%s", hostPath, containerPath))
		}
	}

	// Create container config
	config := &container.Config{
		Image:        r.Image,
		Cmd:          r.Command,
		Env:          r.Env,
		ExposedPorts: exposedPorts,
		Volumes:      volumes,
	}

	// Create host config
	hostConfig := &container.HostConfig{
		PortBindings: portBindings,
		Binds:        binds,
		Resources: container.Resources{
			Memory:   r.Memory,
			NanoCPUs: int64(r.CPU * 1e9), // Convert CPU cores to nano CPUs
		},
	}

	// Set restart policy
	if r.Restart != "" {
		hostConfig.RestartPolicy = container.RestartPolicy{
			Name: container.RestartPolicyMode(r.Restart),
		}
	}

	return config, hostConfig, nil
}

func ContainerList(c *gin.Context) {
	var req ContainerListRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	list, err := docker.ContainerList(c, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to list containers: %v", err)})
		return
	}

	c.JSON(200, list)
}

func InspectContainer(c *gin.Context) {
	id := c.Param("id")

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	inspect, err := docker.ContainerInspect(c, id)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to inspect container: %v", err)})
		return
	}

	c.JSON(200, inspect)
}

func ImageList(c *gin.Context) {
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	images, err := docker.ImageList(c, image.ListOptions{})
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to list images: %v", err)})
		return
	}

	c.JSON(200, images)
}

func ContainerCreate(c *gin.Context) {
	var req ContainerCreateRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	// Convert to Docker types with validation
	config, hostConfig, err := req.ToDockerConfig()
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("invalid configuration: %v", err)})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	createResponse, err := docker.ContainerCreate(c, config, hostConfig, nil, nil, req.Name)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to create container: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       createResponse.ID,
		"warnings": createResponse.Warnings,
	})
}

func Rm(c *gin.Context) {
	id := c.Param("id")

	var req RmRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	err = docker.ContainerRemove(c, id, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to remove container: %v", err)})
		return
	}

	c.Status(200)
}

func Pull(c *gin.Context) {
	imageName := c.Query("imageName")
	if imageName == "" {
		c.JSON(400, gin.H{"error": "image name is required"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	// Pull the image
	pullStream, err := docker.ImagePull(c, imageName, image.PullOptions{})
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to pull image: %v", err)})
		return
	}
	defer pullStream.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Use scanner to read line by line
	scanner := bufio.NewScanner(pullStream)
	for scanner.Scan() {
		line := scanner.Text()

		// Parse the JSON line
		var pullResult map[string]interface{}
		if err := json.Unmarshal([]byte(line), &pullResult); err != nil {
			continue // Skip invalid JSON lines
		}

		// Check for error messages
		if errorDetail, ok := pullResult["errorDetail"].(map[string]interface{}); ok {
			if message, ok := errorDetail["message"].(string); ok {
				c.Writer.Write([]byte(fmt.Sprintf("data: {\"error\": \"%s\"}\n\n", message)))
				c.Writer.Flush()
				return
			}
		}

		// Send the progress update
		c.Writer.Write([]byte("data: " + line + "\n\n"))
		c.Writer.Flush()
	}

	if err := scanner.Err(); err != nil {
		if err == io.EOF {
			c.Writer.Write([]byte("data: [EOF]\n\n"))
			c.Writer.Flush()
			return
		}
		if c.Writer.Written() {
			return // Handle client disconnection gracefully
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("log stream error: %v", err)})
		return
	}

	c.Writer.Write([]byte("data: [EOF]\n\n"))
	c.Writer.Flush()
}

func Start(c *gin.Context) {
	id := c.Param("id")

	var req StartRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	err = docker.ContainerStart(c, id, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to start container: %v", err)})
		return
	}

	c.Status(200)
}

func Stop(c *gin.Context) {
	id := c.Param("id")

	var req StopRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	err = docker.ContainerStop(c, id, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to stop container: %v", err)})
		return
	}

	c.Status(200)
}

func Restart(c *gin.Context) {
	id := c.Param("id")

	var req StopRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	err = docker.ContainerRestart(c, id, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to restart container: %v", err)})
		return
	}

	c.Status(200)
}

func LogsStream(c *gin.Context) {
	id := c.Param("id")

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	logStream, err := docker.ContainerLogs(c, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Timestamps: false,
		Tail:       "0",
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("failed to fetch logs: %v", err)})
		return
	}
	defer logStream.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Flush()

	reader := bufio.NewReader(logStream)
	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-heartbeat.C:
			// Send a heartbeat
			c.Writer.Write([]byte(": heartbeat\n\n"))
			c.Writer.Flush()
		default:
			line, err := reader.ReadString('\n')
			if line != "" {
				if len(line) > 8 && isHeaderPresent([]byte(line)) {
					line = line[8:]
				}

				if len(line) > 0 {
					c.Writer.Write([]byte("data: " + line + "\n"))
					c.Writer.Flush()
				}
			}
			if err != nil {
				if err == io.EOF {
					break
				}
				if c.Writer.Written() {
					return // Handle client disconnection gracefully
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("log stream error: %v", err)})
				return
			}
		}
	}
}

func isHeaderPresent(line []byte) bool {
	// Docker log headers are 8 bytes long, with the first byte identifying the stream (1 or 2).
	// Check for common header patterns
	return line[0] == 1 || line[0] == 2
}

func Logs(c *gin.Context) {
	id := c.Param("id")

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	// Fetch container logs
	logStream, err := docker.ContainerLogs(c, id, container.LogsOptions{ShowStdout: true, ShowStderr: true, Timestamps: false, Tail: "100"})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("failed to fetch logs: %v", err)})
		return
	}
	defer logStream.Close()

	// Prepare to read the logs line by line
	reader := bufio.NewReader(logStream)
	var logs string

	for {
		line, err := reader.ReadString('\n')
		if line != "" {
			// Check if a header is present and strip it if necessary
			if len(line) > 8 && isHeaderPresent([]byte(line)) {
				line = line[8:]
			}
			logs += line
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to read logs: %v", err)})
			return
		}
	}

	c.Data(http.StatusOK, "text/plain", []byte(logs))
}

func StreamDockerEvents(c *gin.Context) {
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Flush()

	eventsChan, errChan := docker.Events(c, events.ListOptions{})

	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case event, ok := <-eventsChan:
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "docker events channel closed"})
				return
			}
			eventData := gin.H{
				"event_type": event.Type,
				"action":     event.Action,
				"actor_id":   truncateID(event.Actor.ID),
				"attributes": event.Actor.Attributes,
				"time":       event.Time,
			}
			if eventJSON, err := json.Marshal(eventData); err == nil {
				c.Writer.Write([]byte("data: " + string(eventJSON) + "\n\n"))
				c.Writer.Flush()
			}
		case err := <-errChan:
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("event stream error: %v", err)})
				return
			}
		case <-heartbeat.C:
			// Send a heartbeat
			c.Writer.Write([]byte(": heartbeat\n\n"))
			c.Writer.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}

func truncateID(id string) string {
	if len(id) > 12 {
		return id[:12]
	}
	return id
}

func GetContainerConnections(c *gin.Context) {
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	containers, err := docker.ContainerList(c, container.ListOptions{})
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to list containers: %v", err)})
		return
	}

	connections := map[string]map[string]int{}

	for _, container := range containers {
		connections[container.ID] = map[string]int{}

		connectionDetails, err := execCommandInContainer(c, docker, container.ID, "netstat -tn")
		if err != nil {
			continue
		}

		lines := strings.Split(connectionDetails, "\n")
		for _, line := range lines {
			if strings.Contains(line, "ESTABLISHED") {
				parts := strings.Fields(line)
				if len(parts) >= 4 {
					// Assuming the local address:port is in the 4th field
					localAddress := parts[3]
					portIndex := strings.LastIndex(localAddress, ":")
					if portIndex != -1 {
						portStr := localAddress[portIndex+1:]
						connections[container.ID][portStr]++
					}
				}
			}
		}
	}

	c.JSON(200, connections)
}

func execCommandInContainer(c *gin.Context, cli *client.Client, containerID, cmd string) (string, error) {
	execConfig := container.ExecOptions{
		Cmd:          []string{"sh", "-c", cmd},
		AttachStdout: true,
		AttachStderr: true,
	}

	execID, err := cli.ContainerExecCreate(c, containerID, execConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create exec instance: %v", err)
	}

	attachResp, err := cli.ContainerExecAttach(c, execID.ID, container.ExecAttachOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to attach to exec instance: %v", err)
	}
	defer attachResp.Close()

	var output bytes.Buffer
	_, err = io.Copy(&output, attachResp.Reader)
	if err != nil {
		return "", fmt.Errorf("failed to read exec output: %v", err)
	}

	return output.String(), nil
}

func ExecInContainer(c *gin.Context) {
	containerID := c.Param("id")
	var req ExecRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	output, err := execCommandInContainer(c, docker, containerID, req.Command)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to execute command: %v", err)})
		return
	}

	if len(output) > 8 && isHeaderPresent([]byte(output)) {
		output = output[8:]
	}

	c.JSON(200, gin.H{"output": output})
}

func RmImage(c *gin.Context) {
	id := c.Param("id")

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	_, err = docker.ImageRemove(c, id, image.RemoveOptions{Force: true})
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to remove image: %v", err)})
		return
	}

	c.Status(200)
}
