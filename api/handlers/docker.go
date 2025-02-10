package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"gsm/config"
	"gsm/docker"
	middleware "gsm/middleware"
	"io"
	"net/http"
	"path"
	"time"

	"github.com/gin-gonic/gin"
)

type DockerHandler struct {
	cli docker.Client
}

func NewDockerHandler() (*DockerHandler, error) {
	cfg := config.Get()
	volumesDir := path.Join(cfg.HostHomeDir, cfg.DataDir, cfg.VolumeDir)

	cli, err := docker.NewClient(volumesDir)
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %v", err)
	}
	return &DockerHandler{cli: cli}, nil
}

// RegisterDockerHandlers registers all docker-related handlers with the given router groups
func (h *DockerHandler) RegisterDockerHandlers(rg *gin.RouterGroup) {
	rg.Use(middleware.CheckUser, middleware.RequireUser)

	// Container endpoints
	rg.GET("/containers", h.listContainers())
	rg.GET("/containers/:id", h.inspectContainer())
	rg.POST("/containers", middleware.RequireRole("admin"), h.createContainer())
	rg.DELETE("/containers/:id", middleware.RequireRole("admin"), h.removeContainer())
	rg.POST("/containers/:id/start", h.startContainer())
	rg.POST("/containers/:id/stop", h.stopContainer())
	rg.POST("/containers/:id/restart", h.restartContainer())
	rg.GET("/containers/:id/logs", h.getLogs())
	rg.GET("/containers/:id/logs-stream", h.streamLogs())
	rg.POST("/containers/:id/exec", middleware.RequireRole("admin"), h.execInContainer())
	rg.PUT("/containers/:id", middleware.RequireRole("admin"), h.updateContainer())

	// Image endpoints
	rg.GET("/images", middleware.RequireRole("admin"), h.listImages())
	rg.DELETE("/images/:id", middleware.RequireRole("admin"), h.removeImage())
	rg.GET("/images/pull", middleware.RequireRole("admin"), h.pullImage())

	// Events endpoint
	rg.GET("/events-stream", h.streamDockerEvents())
}

func (h *DockerHandler) listContainers() gin.HandlerFunc {
	return func(c *gin.Context) {
		containers, err := h.cli.ListContainers(c)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to list containers: %v", err)})
			return
		}

		c.JSON(200, containers)
	}
}

func (h *DockerHandler) inspectContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		inspect, err := h.cli.InspectContainer(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to inspect container: %v", err)})
			return
		}

		c.JSON(200, inspect)
	}
}

func (h *DockerHandler) listImages() gin.HandlerFunc {
	return func(c *gin.Context) {
		images, err := h.cli.ListImages(c)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to list images: %v", err)})
			return
		}

		c.JSON(200, images)
	}
}

func (h *DockerHandler) createContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req docker.ContainerCreate
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid request"})
			return
		}

		id, warnings, err := h.cli.CreateContainer(c, &req)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to create container: %v", err)})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":       id,
			"warnings": warnings,
		})
	}
}

func (h *DockerHandler) removeContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		err := h.cli.RemoveContainer(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to remove container: %v", err)})
			return
		}

		c.Status(200)
	}
}

func (h *DockerHandler) pullImage() gin.HandlerFunc {
	return func(c *gin.Context) {
		imageName := c.Query("imageName")
		if imageName == "" {
			c.JSON(400, gin.H{"error": "image name is required"})
			return
		}

		pullStream, err := h.cli.PullImage(c, imageName)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to pull image: %v", err)})
			return
		}
		defer pullStream.Close()

		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")

		scanner := bufio.NewScanner(pullStream)
		for scanner.Scan() {
			line := scanner.Text()

			var pullResult map[string]interface{}
			if err := json.Unmarshal([]byte(line), &pullResult); err != nil {
				continue
			}

			if errorDetail, ok := pullResult["errorDetail"].(map[string]interface{}); ok {
				if message, ok := errorDetail["message"].(string); ok {
					c.Writer.Write([]byte(fmt.Sprintf("data: {\"error\": \"%s\"}\n\n", message)))
					c.Writer.Flush()
					return
				}
			}

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
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("log stream error: %v", err)})
			return
		}

		c.Writer.Write([]byte("data: [EOF]\n\n"))
		c.Writer.Flush()
	}
}

func (h *DockerHandler) startContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		err := h.cli.StartContainer(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to start container: %v", err)})
			return
		}

		c.Status(200)
	}
}

func (h *DockerHandler) stopContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		err := h.cli.StopContainer(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to stop container: %v", err)})
			return
		}

		c.Status(200)
	}
}

func (h *DockerHandler) restartContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		err := h.cli.RestartContainer(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to restart container: %v", err)})
			return
		}

		c.Status(200)
	}
}

func (h *DockerHandler) streamLogs() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		logStream, err := h.cli.ContainerLogs(c, id, true, 0)
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
				c.Writer.Write([]byte(": heartbeat\n\n"))
				c.Writer.Flush()
			default:
				line, err := reader.ReadString('\n')
				if line != "" {
					if len(line) > 8 && docker.IsHeaderPresent([]byte(line)) {
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
						return
					}
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("log stream error: %v", err)})
					return
				}
			}
		}
	}
}

func (h *DockerHandler) getLogs() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		logStream, err := h.cli.ContainerLogs(c, id, false, 100)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("failed to fetch logs: %v", err)})
			return
		}
		defer logStream.Close()

		reader := bufio.NewReader(logStream)
		logs, err := docker.ProcessLogStream(reader)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to process logs: %v", err)})
			return
		}

		c.Data(http.StatusOK, "text/plain", []byte(logs))
	}
}

func (h *DockerHandler) streamDockerEvents() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Writer.WriteHeader(http.StatusOK)
		c.Writer.Flush()

		eventsChan, errChan := h.cli.StreamEvents(c)

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
				c.Writer.Write([]byte(": heartbeat\n\n"))
				c.Writer.Flush()
			case <-c.Request.Context().Done():
				return
			}
		}
	}
}

func (h *DockerHandler) execInContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		containerID := c.Param("id")
		var req struct {
			Command string `json:"command" binding:"required"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid request"})
			return
		}

		output, err := h.cli.ContainerExec(c, containerID, req.Command)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to execute command: %v", err)})
			return
		}

		c.JSON(200, gin.H{"output": output})
	}
}

func (h *DockerHandler) removeImage() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		err := h.cli.RemoveImage(c, id)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to remove image: %v", err)})
			return
		}

		c.Status(200)
	}
}

func (h *DockerHandler) updateContainer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req docker.ContainerCreate
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid request"})
			return
		}

		newID, warnings, err := h.cli.UpdateContainer(c, id, &req)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("failed to update container: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":       newID,
			"warnings": warnings,
		})
	}
}

func truncateID(id string) string {
	if len(id) > 12 {
		return id[:12]
	}
	return id
}
