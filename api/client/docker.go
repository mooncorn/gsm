package docker

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

const DOCKER_TIME_LAYOUT = time.RFC3339Nano

type Client interface {
	ListContainers(ctx context.Context) ([]ContainerListItem, error)
	InspectContainer(ctx context.Context, id string) (*ContainerInspect, error)
	CreateContainer(ctx context.Context, createConfig *ContainerCreate) (string, []string, error)
	RemoveContainer(ctx context.Context, id string) error
	StartContainer(ctx context.Context, id string) error
	StopContainer(ctx context.Context, id string) error
	RestartContainer(ctx context.Context, id string) error
	ContainerLogs(ctx context.Context, id string, follow bool, tail int) (io.ReadCloser, error)
	ContainerExec(ctx context.Context, id string, cmd string) (string, error)
	ListImages(ctx context.Context) ([]image.Summary, error)
	PullImage(ctx context.Context, imageName string) (io.ReadCloser, error)
	RemoveImage(ctx context.Context, id string) error
	ContainerConnections(ctx context.Context) (map[string]int, error)
	ContainerConnectionsByID(ctx context.Context, containerID string) (map[string]int, error)
	StreamEvents(ctx context.Context) (<-chan events.Message, <-chan error)
	UpdateContainer(ctx context.Context, id string, createConfig *ContainerCreate) (string, []string, error)
}

type dockerClient struct {
	cli *client.Client
}

func NewClient() (Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %v", err)
	}
	return &dockerClient{cli: cli}, nil
}

func (d *dockerClient) ListContainers(ctx context.Context) ([]ContainerListItem, error) {
	list, err := d.cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %v", err)
	}

	containers := make([]ContainerListItem, len(list))
	for i, container := range list {
		containers[i] = ContainerListItem{
			ID:     container.ID,
			Names:  container.Names,
			Image:  container.Image,
			State:  container.State,
			Status: container.Status,
		}
	}

	return containers, nil
}

func (d *dockerClient) InspectContainer(ctx context.Context, id string) (*ContainerInspect, error) {
	inspect, err := d.cli.ContainerInspect(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container: %v", err)
	}

	created, err := parseDockerTime(inspect.Created)
	if err != nil {
		return nil, fmt.Errorf("failed to parse created time: %v", err)
	}

	mounts := make([]Mount, len(inspect.Mounts))
	for i, mount := range inspect.Mounts {
		mounts[i] = Mount{
			Type:     string(mount.Type),
			Source:   mount.Source,
			Target:   mount.Destination,
			ReadOnly: mount.RW,
		}
	}

	startedAt, err := parseDockerTime(inspect.State.StartedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to parse startedAt time: %v", err)
	}

	finishedAt, err := parseDockerTime(inspect.State.FinishedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to parse finishedAt time: %v", err)
	}

	portBindings := make(map[string][]ContainerPortBinding)
	for port, bindings := range inspect.HostConfig.PortBindings {
		for _, binding := range bindings {
			hostPort, _ := strconv.ParseUint(binding.HostPort, 10, 16)
			portBindings[string(port)] = append(portBindings[string(port)], ContainerPortBinding{
				HostPort:      uint16(hostPort),
				ContainerPort: uint16(hostPort),
				Protocol:      strings.Split(string(port), "/")[1],
			})
		}
	}

	connections := make(map[string]int)
	if inspect.State.Running {
		connections, err = d.ContainerConnectionsByID(ctx, inspect.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get connections for container %s: %v", inspect.ID, err)
		}
	}

	return &ContainerInspect{
		ID:      inspect.ID,
		Created: created,
		State: ContainerState{
			Status:     inspect.State.Status,
			Running:    inspect.State.Running,
			StartedAt:  startedAt,
			FinishedAt: finishedAt,
		},
		Name:   inspect.Name,
		Mounts: mounts,
		Config: ContainerConfig{
			Image:        inspect.Config.Image,
			Env:          inspect.Config.Env,
			Tty:          inspect.Config.Tty,
			AttachStdin:  inspect.Config.AttachStdin,
			AttachStdout: inspect.Config.AttachStdout,
			AttachStderr: inspect.Config.AttachStderr,
		},
		HostConfig: ContainerHostConfig{
			PortBindings:  portBindings,
			Binds:         inspect.HostConfig.Binds,
			Memory:        inspect.HostConfig.Resources.Memory / 1024 / 1024,
			CPU:           float64(inspect.HostConfig.Resources.NanoCPUs) / 1e9,
			RestartPolicy: ContainerRestartPolicy{Name: string(inspect.HostConfig.RestartPolicy.Name)},
		},
		Connections: connections,
	}, nil
}

func (d *dockerClient) CreateContainer(ctx context.Context, createConfig *ContainerCreate) (string, []string, error) {
	config, hostConfig, err := createConfig.ToDockerConfig()
	if err != nil {
		return "", nil, fmt.Errorf("invalid configuration: %v", err)
	}

	createResponse, err := d.cli.ContainerCreate(ctx, config, hostConfig, nil, nil, createConfig.Name)
	if err != nil {
		return "", nil, fmt.Errorf("failed to create container: %v", err)
	}

	return createResponse.ID, createResponse.Warnings, nil
}

func (d *dockerClient) RemoveContainer(ctx context.Context, id string) error {
	err := d.cli.ContainerRemove(ctx, id, container.RemoveOptions{RemoveVolumes: false})
	if err != nil {
		return fmt.Errorf("failed to remove container %s: %v", id, err)
	}
	return nil
}

func (d *dockerClient) StartContainer(ctx context.Context, id string) error {
	err := d.cli.ContainerStart(ctx, id, container.StartOptions{})
	if err != nil {
		return fmt.Errorf("failed to start container %s: %v", id, err)
	}
	return nil
}

func (d *dockerClient) StopContainer(ctx context.Context, id string) error {
	err := d.cli.ContainerStop(ctx, id, container.StopOptions{})
	if err != nil {
		return fmt.Errorf("failed to stop container %s: %v", id, err)
	}
	return nil
}

func (d *dockerClient) RestartContainer(ctx context.Context, id string) error {
	err := d.cli.ContainerRestart(ctx, id, container.StopOptions{})
	if err != nil {
		return fmt.Errorf("failed to restart container %s: %v", id, err)
	}
	return nil
}

func (d *dockerClient) ContainerLogs(ctx context.Context, id string, follow bool, tail int) (io.ReadCloser, error) {
	return d.cli.ContainerLogs(ctx, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     follow,
		Timestamps: false,
		Tail:       strconv.Itoa(tail),
	})
}

func (d *dockerClient) ContainerExec(ctx context.Context, id string, cmd string) (string, error) {
	execConfig := container.ExecOptions{
		Cmd:          []string{"/bin/sh", "-c", cmd},
		AttachStdout: true,
		AttachStderr: true,
		Tty:          false,
	}

	execID, err := d.cli.ContainerExecCreate(ctx, id, execConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create exec instance %s: %v", id, err)
	}

	attachResp, err := d.cli.ContainerExecAttach(ctx, execID.ID, container.ExecAttachOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to attach to exec instance %s: %v", id, err)
	}
	defer attachResp.Close()

	var output strings.Builder
	_, err = io.Copy(&output, attachResp.Reader)
	if err != nil {
		return "", fmt.Errorf("failed to read exec output %s: %v", id, err)
	}

	return output.String(), nil
}

func (d *dockerClient) ListImages(ctx context.Context) ([]image.Summary, error) {
	return d.cli.ImageList(ctx, image.ListOptions{})
}

func (d *dockerClient) PullImage(ctx context.Context, imageName string) (io.ReadCloser, error) {
	return d.cli.ImagePull(ctx, imageName, image.PullOptions{})
}

func (d *dockerClient) RemoveImage(ctx context.Context, id string) error {
	_, err := d.cli.ImageRemove(ctx, id, image.RemoveOptions{Force: true})
	if err != nil {
		return fmt.Errorf("failed to remove image %s: %v", id, err)
	}
	return nil
}

func (d *dockerClient) ContainerConnections(ctx context.Context) (map[string]int, error) {
	containers, err := d.cli.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %v", err)
	}

	connections := map[string]int{}

	for _, container := range containers {
		containerConnections, err := d.ContainerConnectionsByID(ctx, container.ID)
		if err != nil {
			continue
		}
		for portProto, count := range containerConnections {
			connections[portProto] += count
		}
	}

	return connections, nil
}

func (d *dockerClient) ContainerConnectionsByID(ctx context.Context, containerID string) (map[string]int, error) {
	connections := map[string]int{}

	connectionDetails, err := d.ContainerExec(ctx, containerID, "netstat -tn")
	if err != nil {
		return nil, fmt.Errorf("failed to get connections for container %s: %v", containerID, err)
	}

	lines := strings.Split(connectionDetails, "\n")
	for _, line := range lines {
		if strings.Contains(line, "ESTABLISHED") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				localAddress := parts[3]
				portIndex := strings.LastIndex(localAddress, ":")
				if portIndex != -1 {
					portStr := localAddress[portIndex+1:]
					// Default to tcp since we're using netstat -tn
					portProto := portStr + "/tcp"
					connections[portProto]++
				}
			}
		}
	}

	return connections, nil
}

func (d *dockerClient) StreamEvents(ctx context.Context) (<-chan events.Message, <-chan error) {
	return d.cli.Events(ctx, events.ListOptions{})
}

func (d *dockerClient) UpdateContainer(ctx context.Context, id string, req *ContainerCreate) (string, []string, error) {
	// Get current container details
	inspect, err := d.cli.ContainerInspect(ctx, id)
	if err != nil {
		return "", nil, fmt.Errorf("failed to inspect container %s: %v", id, err)
	}

	// Remove the container
	if err := d.RemoveContainer(ctx, id); err != nil {
		return "", nil, fmt.Errorf("failed to remove container %s: %v", id, err)
	}

	// Create new container with updated configuration
	id, warnings, err := d.CreateContainer(ctx, req)
	if err != nil {
		// Recreate the old container
		_, err = d.cli.ContainerCreate(ctx, inspect.Config, inspect.HostConfig, nil, nil, inspect.Name)
		if err != nil {
			return "", nil, fmt.Errorf("failed to recreate previous container %s: %v", id, err)
		}

		return "", nil, fmt.Errorf("failed to update container %s: %v", id, err)
	}

	return id, warnings, nil
}

func IsHeaderPresent(line []byte) bool {
	return line[0] == 1 || line[0] == 2
}

func StripHeader(line string) string {
	if len(line) > 8 && IsHeaderPresent([]byte(line)) {
		return line[8:]
	}
	return line
}

func ProcessLogStream(reader *bufio.Reader) (string, error) {
	var logs string

	for {
		line, err := reader.ReadString('\n')
		if line != "" {
			logs += StripHeader(line)
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", fmt.Errorf("failed to read logs: %v", err)
		}
	}

	return logs, nil
}

func parseDockerTime(s string) (time.Time, error) {
	return time.Parse(DOCKER_TIME_LAYOUT, s)
}

func (r *ContainerCreate) ToDockerConfig() (*container.Config, *container.HostConfig, error) {
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
			// Create the host path as /gsm/volumes/<container_name>/<path>
			hostPath := filepath.Join("/gsm/volumes", r.Name, volume)
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
		Tty:          r.Tty,
		AttachStdin:  r.AttachStdin,
		AttachStdout: r.AttachStdout,
		AttachStderr: r.AttachStderr,
	}

	// Create host config
	hostConfig := &container.HostConfig{
		PortBindings: portBindings,
		Binds:        binds,
		Resources: container.Resources{
			// Memory is in MB, convert to bytes
			Memory: r.Memory * 1024 * 1024,
			// CPU is in cores, convert to nano CPUs
			NanoCPUs: int64(r.CPU * 1e9),
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
