package handlers

import (
	"fmt"
	"gsm/config"
	"gsm/files"
	middleware "gsm/middleware"
	"net/http"
	"path"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	cli files.Client
}

func NewFileHandler() (*FileHandler, error) {
	cfg := config.Get()

	volumesDir := path.Join(cfg.DataDir, cfg.VolumeDir)

	cli := files.NewClient(volumesDir)
	return &FileHandler{cli: cli}, nil
}

// RegisterFileHandlers registers all file-related handlers with the given router group
func (h *FileHandler) RegisterFileHandlers(rg *gin.RouterGroup) {
	rg.Use(middleware.CheckUser, middleware.RequireUser)

	// File endpoints
	rg.GET("/", h.listFiles())
	rg.GET("/content", h.readFile())
	rg.POST("/content", middleware.RequireRole("admin"), h.writeFile())
	rg.POST("/directory", middleware.RequireRole("admin"), h.createDirectory())
	rg.DELETE("/", middleware.RequireRole("admin"), h.deletePath())
	rg.POST("/move", middleware.RequireRole("admin"), h.movePath())
	rg.GET("/download", h.downloadFile())
	rg.POST("/upload", middleware.RequireRole("admin"), h.uploadFile())
}

func (h *FileHandler) listFiles() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestPath := c.Query("path")
		if requestPath == "" {
			requestPath = "/"
		}

		files, err := h.cli.ListFiles(requestPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, files)
	}
}

func (h *FileHandler) readFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestPath := c.Query("path")
		if requestPath == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
			return
		}

		content, mime, err := h.cli.ReadFile(requestPath)
		if err != nil {
			if mime != "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": err.Error(),
					"mime":  mime,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"content": content})
	}
}

func (h *FileHandler) writeFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		err := h.cli.WriteFile(req.Path, req.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "file updated successfully"})
	}
}

func (h *FileHandler) createDirectory() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Path string `json:"path"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		err := h.cli.CreateDirectory(req.Path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "directory created successfully"})
	}
}

func (h *FileHandler) deletePath() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestPath := c.Query("path")
		if requestPath == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
			return
		}

		err := h.cli.DeletePath(requestPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
	}
}

func (h *FileHandler) movePath() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Source      string `json:"source"`
			Destination string `json:"destination"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		err := h.cli.MovePath(req.Source, req.Destination)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "moved successfully"})
	}
}

func (h *FileHandler) downloadFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestPath := c.Query("path")
		if requestPath == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
			return
		}

		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", requestPath))
		err := h.cli.DownloadFile(requestPath, c.Writer)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
}

func (h *FileHandler) uploadFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		destination := c.PostForm("path")
		if destination == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
			return
		}

		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
			return
		}

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to open uploaded file: %v", err)})
			return
		}
		defer src.Close()

		err = h.cli.UploadFile(destination, file.Filename, src)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "file uploaded successfully"})
	}
}
