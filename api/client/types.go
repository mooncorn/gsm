package docker

import (
	"time"
)

type ContainerListItem struct {
	ID     string   `json:"id"`
	Names  []string `json:"names"`
	Image  string   `json:"image"`
	State  string   `json:"state"`
	Status string   `json:"status"`
}

type ContainerInspect struct {
	ID          string              `json:"id"`
	Created     time.Time           `json:"created"`
	State       ContainerState      `json:"state"`
	Name        string              `json:"name"`
	Mounts      []Mount             `json:"mounts"`
	Config      ContainerConfig     `json:"config"`
	HostConfig  ContainerHostConfig `json:"hostConfig"`
	Connections map[string]int      `json:"connections"` // hostport/protocol -> nb of connections
}

type Mount struct {
	Type     string `json:"type"`
	Source   string `json:"source"`
	Target   string `json:"target"`
	ReadOnly bool   `json:"readOnly"`
}

type ContainerState struct {
	Status     string    `json:"status"`
	Running    bool      `json:"running"`
	StartedAt  time.Time `json:"startedAt"`
	FinishedAt time.Time `json:"finishedAt"`
}

type ContainerConfig struct {
	Image        string              `json:"image"`
	Env          []string            `json:"env"`
	Tty          bool                `json:"tty"`
	AttachStdin  bool                `json:"attachStdin"`
	AttachStdout bool                `json:"attachStdout"`
	AttachStderr bool                `json:"attachStderr"`
	ExposedPorts map[string]struct{} `json:"exposedPorts"`
	Volumes      map[string]struct{} `json:"volumes"`
}

type ContainerHostConfig struct {
	PortBindings  map[string][]ContainerPortBinding `json:"portBindings"`
	Binds         []string                          `json:"binds"`
	Memory        int64                             `json:"memory" binding:"gte=0"`
	CPU           float64                           `json:"cpu" binding:"gte=0"`
	RestartPolicy ContainerRestartPolicy            `json:"restartPolicy"`
}

type ContainerResources struct {
	Memory int64   `json:"memory" binding:"gte=0"`
	CPU    float64 `json:"cpu" binding:"gte=0"`
}

type ContainerPortBinding struct {
	HostPort      uint16 `json:"hostPort" binding:"required,gt=0"`
	ContainerPort uint16 `json:"containerPort" binding:"required,gt=0"`
	Protocol      string `json:"protocol" binding:"oneof=tcp udp"`
}

type ContainerCreate struct {
	Name         string        `json:"name" binding:"required"`
	Image        string        `json:"image" binding:"required"`
	Ports        []PortMapping `json:"ports"`
	Env          []string      `json:"env"`
	Memory       int64         `json:"memory" binding:"gte=0"`
	CPU          float64       `json:"cpu" binding:"gte=0"`
	Command      []string      `json:"command"`
	Restart      string        `json:"restart" binding:"oneof=no on-failure always unless-stopped"`
	Volumes      []string      `json:"volumes"`
	Tty          bool          `json:"tty"`
	AttachStdin  bool          `json:"attachStdin"`
	AttachStdout bool          `json:"attachStdout"`
	AttachStderr bool          `json:"attachStderr"`
}

type ContainerRestartPolicy struct {
	Name string `json:"name" binding:"required,oneof=no on-failure always unless-stopped"`
}

type PortMapping struct {
	HostPort      uint16 `json:"hostPort" binding:"required,gt=0"`
	ContainerPort uint16 `json:"containerPort" binding:"required,gt=0"`
	Protocol      string `json:"protocol" binding:"oneof=tcp udp"`
}

type FileInfo struct {
	Name         string    `json:"name"`
	Path         string    `json:"path"`
	Size         int64     `json:"size"`
	IsDir        bool      `json:"isDir"`
	ModTime      time.Time `json:"modTime"`
	Permissions  string    `json:"permissions"`
	IsReadable   bool      `json:"isReadable"`
	IsWritable   bool      `json:"isWritable"`
	IsExecutable bool      `json:"isExecutable"`
}
