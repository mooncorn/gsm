package handlers

import (
	"fmt"
	"runtime"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemResourcesResponse struct {
	Memory struct {
		Total       uint64  `json:"total"`        // Total memory in bytes
		Used        uint64  `json:"used"`         // Used memory in bytes
		Free        uint64  `json:"free"`         // Free memory in bytes
		Available   uint64  `json:"available"`    // Available memory in bytes
		UsedPercent float64 `json:"used_percent"` // Percentage of memory used
	} `json:"memory"`
	CPU struct {
		Cores        int       `json:"cores"`        // Number of CPU cores
		Used         float64   `json:"used"`         // CPU usage percentage
		ModelName    string    `json:"model_name"`   // CPU model name
		Frequencies  []float64 `json:"frequencies"`  // CPU frequencies per core in MHz
		Temperature  float64   `json:"temperature"`  // CPU temperature if available
		Architecture string    `json:"architecture"` // CPU architecture
	} `json:"cpu"`
	Docker struct {
		RunningContainers int `json:"running_containers"` // Number of running containers
		TotalContainers   int `json:"total_containers"`   // Total number of containers
		TotalImages       int `json:"total_images"`       // Total number of images
	} `json:"docker"`
	Disk struct {
		Total       uint64  `json:"total"`        // Total disk space in bytes
		Used        uint64  `json:"used"`         // Used disk space in bytes
		Free        uint64  `json:"free"`         // Free disk space in bytes
		UsedPercent float64 `json:"used_percent"` // Percentage of disk used
	} `json:"disk"`
	System struct {
		OS            string    `json:"os"`             // Operating system
		Platform      string    `json:"platform"`       // Platform (e.g., linux, windows)
		KernelVersion string    `json:"kernel_version"` // Kernel version
		Uptime        float64   `json:"uptime"`         // System uptime in seconds
		LastUpdate    time.Time `json:"last_update"`    // Timestamp of this update
	} `json:"system"`
}

func GetSystemResources(c *gin.Context) {
	var response SystemResourcesResponse

	// Get memory information
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to get memory info: %v", err)})
		return
	}

	response.Memory.Total = memInfo.Total
	response.Memory.Used = memInfo.Used
	response.Memory.Free = memInfo.Free
	response.Memory.UsedPercent = memInfo.UsedPercent

	// Get CPU information
	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		response.CPU.ModelName = cpuInfo[0].ModelName
		response.CPU.Architecture = runtime.GOARCH
	}

	cpuPercent, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuPercent) > 0 {
		response.CPU.Used = cpuPercent[0]
	}

	frequencies, err := cpu.Info()
	if err == nil {
		freqs := make([]float64, len(frequencies))
		for i, f := range frequencies {
			freqs[i] = f.Mhz
		}
		response.CPU.Frequencies = freqs
	}

	response.CPU.Cores = runtime.NumCPU()

	// Get disk information
	diskInfo, err := disk.Usage("/")
	if err == nil {
		response.Disk.Total = diskInfo.Total
		response.Disk.Used = diskInfo.Used
		response.Disk.Free = diskInfo.Free
		response.Disk.UsedPercent = diskInfo.UsedPercent
	}

	// Get Docker information
	if cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation()); err == nil {
		defer cli.Close()

		// Get running containers
		if containers, err := cli.ContainerList(c, container.ListOptions{All: false}); err == nil {
			response.Docker.RunningContainers = len(containers)
		}

		// Get all containers (including stopped)
		if containers, err := cli.ContainerList(c, container.ListOptions{All: true}); err == nil {
			response.Docker.TotalContainers = len(containers)
		}

		// Get all images
		if images, err := cli.ImageList(c, image.ListOptions{}); err == nil {
			response.Docker.TotalImages = len(images)
		}
	}

	// Get system information
	response.System.OS = runtime.GOOS
	response.System.Platform = runtime.GOOS
	response.System.LastUpdate = time.Now()

	c.JSON(200, response)
}

func StreamSystemResources(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case <-ticker.C:
			var response SystemResourcesResponse

			// Get memory information
			if memInfo, err := mem.VirtualMemory(); err == nil {
				response.Memory.Total = memInfo.Total
				response.Memory.Used = memInfo.Used
				response.Memory.Free = memInfo.Free
				response.Memory.Available = memInfo.Available
				response.Memory.UsedPercent = memInfo.UsedPercent
			}

			// Get CPU information
			if cpuInfo, err := cpu.Info(); err == nil && len(cpuInfo) > 0 {
				response.CPU.ModelName = cpuInfo[0].ModelName
				response.CPU.Architecture = runtime.GOARCH
			}

			// Calculate CPU percentage with a 1-second interval
			if cpuPercent, err := cpu.Percent(time.Second, false); err == nil && len(cpuPercent) > 0 {
				response.CPU.Used = cpuPercent[0]
			}

			response.CPU.Cores = runtime.NumCPU()

			// Get disk information
			if diskInfo, err := disk.Usage("/"); err == nil {
				response.Disk.Total = diskInfo.Total
				response.Disk.Used = diskInfo.Used
				response.Disk.Free = diskInfo.Free
				response.Disk.UsedPercent = diskInfo.UsedPercent
			}

			// Get Docker information
			if cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation()); err == nil {
				// Get running containers
				if containers, err := cli.ContainerList(c, container.ListOptions{All: false}); err == nil {
					response.Docker.RunningContainers = len(containers)
				}

				// Get all containers (including stopped)
				if containers, err := cli.ContainerList(c, container.ListOptions{All: true}); err == nil {
					response.Docker.TotalContainers = len(containers)
				}

				// Get all images
				if images, err := cli.ImageList(c, image.ListOptions{}); err == nil {
					response.Docker.TotalImages = len(images)
				}
			}

			// Get system information
			response.System.OS = runtime.GOOS
			response.System.Platform = runtime.GOOS
			response.System.LastUpdate = time.Now()

			c.SSEvent("message", response)
			c.Writer.Flush()
		}
	}
}
