package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemResources struct {
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	Disk    float64 `json:"disk"`
	GPUUsed bool    `json:"gpuUsed"`
}

func GetSystemResources(c *gin.Context) {
	// Get CPU usage
	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get CPU usage"})
		return
	}

	// Get memory usage
	memory, err := mem.VirtualMemory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get memory usage"})
		return
	}

	// Get disk usage
	disk, err := disk.Usage("/")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get disk usage"})
		return
	}

	resources := SystemResources{
		CPU:     cpuPercent[0],
		Memory:  memory.UsedPercent,
		Disk:    disk.UsedPercent,
		GPUUsed: false, // We can implement GPU detection later if needed
	}

	c.JSON(http.StatusOK, resources)
}

func StreamSystemResources(c *gin.Context) {
	// Set headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	// Create a channel to signal client disconnection
	clientGone := c.Writer.CloseNotify()

	// Send system resources every second
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-clientGone:
			return
		case <-ticker.C:
			// Get CPU usage
			cpuPercent, err := cpu.Percent(0, false)
			if err != nil {
				return
			}

			// Get memory usage
			memory, err := mem.VirtualMemory()
			if err != nil {
				return
			}

			// Get disk usage
			disk, err := disk.Usage("/")
			if err != nil {
				return
			}

			resources := SystemResources{
				CPU:     cpuPercent[0],
				Memory:  memory.UsedPercent,
				Disk:    disk.UsedPercent,
				GPUUsed: false,
			}

			// Marshal the data
			data, err := json.Marshal(resources)
			if err != nil {
				return
			}

			// Write the event
			c.SSEvent("message", string(data))
			c.Writer.Flush()
		}
	}
}
