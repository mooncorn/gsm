package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
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
	var req ImageListRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	images, err := docker.ImageList(c, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to list images: %v", err)})
		return
	}

	c.JSON(200, images)
}

func Run(c *gin.Context) {
	var req RunRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	createResponse, err := docker.ContainerCreate(c, &req.Config, &req.HostConfig, &req.NetworkConfig, req.platform, req.ContainerName)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to create container: %v", err)})
		return
	}

	c.JSON(200, createResponse)
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
	var req PullRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create docker client: %v", err)})
		return
	}

	// Pull the image
	pullStream, err := docker.ImagePull(c, req.ImageName, req.Options)
	if err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("failed to pull image: %v", err)})
		return
	}
	defer pullStream.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Buffer to read pull data
	buf := make([]byte, 1024)
	for {
		n, err := pullStream.Read(buf)
		if n > 0 {
			c.Writer.Write([]byte("data: " + string(buf[:n]) + "\n\n"))
			c.Writer.Flush()
		}
		if err != nil {
			if err == io.EOF {
				c.Writer.Write([]byte("data: [EOF]\n\n"))
				c.Writer.Flush()
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

	// Create Docker client
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	// Create a stream for only new logs
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

	// Set headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Flush()

	// Buffer to read log data line by line
	reader := bufio.NewReader(logStream)
	for {
		line, err := reader.ReadString('\n')
		if line != "" {
			if len(line) > 8 && isHeaderPresent([]byte(line)) {
				// Strip the first 8 bytes if headers are present
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
	// var req EventsRequest
	// if err := c.BindJSON(&req); err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
	// 	return
	// }

	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create Docker client: %v", err)})
		return
	}

	// Set headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Flush()

	// Create a Docker events channel
	eventsChan, errChan := docker.Events(c, events.ListOptions{})

	// Stream Docker events
	for {
		select {
		case event, ok := <-eventsChan:
			// Check if the channel is closed
			if !ok {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "docker events channel closed"})
				return
			}

			// Prepare the event data as a map for JSON encoding
			eventData := map[string]interface{}{
				"event_type": event.Type,
				"action":     event.Action,
				"actor_id":   event.Actor.ID[:12], // Limiting actor ID to 12 chars
				"attributes": event.Actor.Attributes,
			}

			// Convert event data to JSON
			eventJSON, err := json.Marshal(eventData)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to marshal event to JSON: %v", err)})
				return
			}

			// Send event as SSE
			c.Writer.Write([]byte("data: " + string(eventJSON) + "\n\n"))
			c.Writer.Flush()

		case err := <-errChan:
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("event stream error: %v", err)})
				return
			}

		case <-c.Request.Context().Done():
			// Handle client disconnection gracefully
			return
		}
	}
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
