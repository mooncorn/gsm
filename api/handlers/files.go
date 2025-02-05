package handlers

import (
	"fmt"
	docker "gsm/client"
	middleware "gsm/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

const BASE_DIR = "/gsm/volumes"

type FileHandler struct {
	cli docker.FileClient
}

func NewFileHandler() (*FileHandler, error) {
	cli := docker.NewFileClient(BASE_DIR)
	return &FileHandler{cli: cli}, nil
}

// RegisterFileHandlers registers all file-related handlers with the given router group
func RegisterFileHandlers(router gin.IRouter) error {
	handler, err := NewFileHandler()
	if err != nil {
		return fmt.Errorf("failed to create file handler: %v", err)
	}

	// File endpoints
	router.GET("/files", handler.listFiles())
	router.GET("/files/content", handler.readFile())
	router.POST("/files/content", middleware.RequireRole("admin"), handler.writeFile())
	router.POST("/files/directory", middleware.RequireRole("admin"), handler.createDirectory())
	router.DELETE("/files", middleware.RequireRole("admin"), handler.deletePath())
	router.POST("/files/move", middleware.RequireRole("admin"), handler.movePath())
	router.GET("/files/download", handler.downloadFile())
	router.POST("/files/upload", middleware.RequireRole("admin"), handler.uploadFile())

	return nil
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
