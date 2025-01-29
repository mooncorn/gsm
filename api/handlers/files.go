package handlers

import (
	"archive/zip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
)

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

func getBaseDir() string {
	return "/gsm/shared"
}

func sanitizePath(requestPath string) (string, error) {
	// Use the shared directory as the base
	baseDir := getBaseDir()

	// Join the base directory with the requested path
	fullPath := filepath.Join(baseDir, requestPath)

	// Clean the path to remove any ".." or "." components
	fullPath = filepath.Clean(fullPath)

	// Check if the resulting path is within the shared directory
	if !strings.HasPrefix(fullPath, baseDir) {
		return "", fmt.Errorf("access denied: path outside shared directory")
	}

	return fullPath, nil
}

func getFilePermissions(info os.FileInfo) (bool, bool, bool) {
	mode := info.Mode()
	isReadable := mode&0444 != 0   // Check if readable
	isWritable := mode&0222 != 0   // Check if writable
	isExecutable := mode&0111 != 0 // Check if executable
	return isReadable, isWritable, isExecutable
}

// ListFiles handles GET /files
func ListFiles(c *gin.Context) {
	requestPath := c.Query("path")
	if requestPath == "" {
		requestPath = "/"
	}

	fullPath, err := sanitizePath(requestPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to read directory: %v", err)})
		return
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		isReadable, isWritable, isExecutable := getFilePermissions(info)
		relativePath := strings.TrimPrefix(filepath.Join(requestPath, entry.Name()), "/")

		files = append(files, FileInfo{
			Name:         entry.Name(),
			Path:         relativePath,
			Size:         info.Size(),
			IsDir:        entry.IsDir(),
			ModTime:      info.ModTime(),
			Permissions:  info.Mode().String(),
			IsReadable:   isReadable,
			IsWritable:   isWritable,
			IsExecutable: isExecutable,
		})
	}

	c.JSON(http.StatusOK, files)
}

// ReadFile handles GET /files/content
func ReadFile(c *gin.Context) {
	requestPath := c.Query("path")
	if requestPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}

	fullPath, err := sanitizePath(requestPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	// Read first 512 bytes to detect content type
	file, err := os.Open(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to open file: %v", err)})
		return
	}
	defer file.Close()

	// Detect MIME type
	mime, err := mimetype.DetectReader(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to detect file type: %v", err)})
		return
	}

	// Check if it's a text file
	isText := strings.HasPrefix(mime.String(), "text/") ||
		mime.String() == "application/json" ||
		mime.String() == "application/javascript" ||
		mime.String() == "application/xml" ||
		mime.String() == "application/x-yaml" ||
		strings.HasSuffix(strings.ToLower(requestPath), ".md") ||
		strings.HasSuffix(strings.ToLower(requestPath), ".txt")

	if !isText {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot edit binary file",
			"mime":  mime.String(),
		})
		return
	}

	// Reset file pointer to beginning
	_, err = file.Seek(0, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to read file: %v", err)})
		return
	}

	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to read file: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"content": string(content)})
}

// WriteFile handles POST /files/content
func WriteFile(c *gin.Context) {
	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	fullPath, err := sanitizePath(req.Path)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err = os.WriteFile(fullPath, []byte(req.Content), 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to write file: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "file updated successfully"})
}

// CreateDirectory handles POST /files/directory
func CreateDirectory(c *gin.Context) {
	var req struct {
		Path string `json:"path"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	fullPath, err := sanitizePath(req.Path)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err = os.MkdirAll(fullPath, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create directory: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "directory created successfully"})
}

// DeletePath handles DELETE /files
func DeletePath(c *gin.Context) {
	requestPath := c.Query("path")
	if requestPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}

	fullPath, err := sanitizePath(requestPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err = os.RemoveAll(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to delete: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}

// MovePath handles POST /files/move
func MovePath(c *gin.Context) {
	var req struct {
		Source      string `json:"source"`
		Destination string `json:"destination"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	sourcePath, err := sanitizePath(req.Source)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	destPath, err := sanitizePath(req.Destination)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err = os.Rename(sourcePath, destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to move: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "moved successfully"})
}

// DownloadFile handles GET /files/download
func DownloadFile(c *gin.Context) {
	requestPath := c.Query("path")
	if requestPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}

	fullPath, err := sanitizePath(requestPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to get file info: %v", err)})
		return
	}

	if info.IsDir() {
		// For directories, create a zip file
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.zip", filepath.Base(fullPath)))
		c.Header("Content-Type", "application/zip")

		// Create a zip writer
		err = createZipFromDir(c.Writer, fullPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create zip: %v", err)})
			return
		}
	} else {
		// For single files, send directly
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filepath.Base(fullPath)))
		c.File(fullPath)
	}
}

// UploadFile handles POST /files/upload
func UploadFile(c *gin.Context) {
	destination := c.PostForm("path")
	if destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}

	fullPath, err := sanitizePath(destination)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	// Create destination directory if it doesn't exist
	err = os.MkdirAll(filepath.Dir(fullPath), 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create directory: %v", err)})
		return
	}

	filePath := filepath.Join(fullPath, file.Filename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to save file: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "file uploaded successfully"})
}

func createZipFromDir(writer io.Writer, dir string) error {
	zipWriter := zip.NewWriter(writer)
	defer zipWriter.Close()

	// Walk through the directory
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Create a zip header
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		// Set the header name to be relative to the directory being zipped
		relPath, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}
		header.Name = relPath

		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}

		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()
			_, err = io.Copy(writer, file)
		}
		return err
	})

	return err
}
