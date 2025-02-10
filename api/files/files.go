package files

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

type Client interface {
	ListFiles(path string) ([]FileInfo, error)
	ReadFile(path string) (string, string, error)
	WriteFile(path string, content string) error
	CreateDirectory(path string) error
	DeletePath(path string) error
	MovePath(source, destination string) error
	DownloadFile(path string, writer io.Writer) error
	UploadFile(destination string, filename string, file io.Reader) error
}

type fileClient struct {
	baseDir string
}

func NewClient(baseDir string) Client {
	return &fileClient{baseDir: baseDir}
}

func (f *fileClient) ListFiles(path string) ([]FileInfo, error) {
	if path == "" {
		path = "/"
	}

	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %v", err)
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		isReadable, isWritable, isExecutable := getFilePermissions(info)
		relativePath := strings.TrimPrefix(filepath.Join(path, entry.Name()), "/")

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

	return files, nil
}

func (f *fileClient) ReadFile(path string) (string, string, error) {
	if path == "" {
		return "", "", fmt.Errorf("path is required")
	}

	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return "", "", err
	}

	file, err := os.Open(fullPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Detect MIME type
	mime, err := mimetype.DetectReader(file)
	if err != nil {
		return "", "", fmt.Errorf("failed to detect file type: %v", err)
	}

	// Check if it's a text file
	isText := strings.HasPrefix(mime.String(), "text/") ||
		mime.String() == "application/json" ||
		mime.String() == "application/javascript" ||
		mime.String() == "application/xml" ||
		mime.String() == "application/x-yaml" ||
		strings.HasSuffix(strings.ToLower(path), ".md") ||
		strings.HasSuffix(strings.ToLower(path), ".txt")

	if !isText {
		return "", mime.String(), fmt.Errorf("cannot read binary file")
	}

	// Reset file pointer to beginning
	_, err = file.Seek(0, 0)
	if err != nil {
		return "", "", fmt.Errorf("failed to read file: %v", err)
	}

	content, err := io.ReadAll(file)
	if err != nil {
		return "", "", fmt.Errorf("failed to read file: %v", err)
	}

	return string(content), mime.String(), nil
}

func (f *fileClient) WriteFile(path, content string) error {
	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return err
	}

	err = os.WriteFile(fullPath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %v", err)
	}

	return nil
}

func (f *fileClient) CreateDirectory(path string) error {
	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return err
	}

	err = os.MkdirAll(fullPath, 0755)
	if err != nil {
		return fmt.Errorf("failed to create directory: %v", err)
	}

	return nil
}

func (f *fileClient) DeletePath(path string) error {
	if path == "" {
		return fmt.Errorf("path is required")
	}

	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return err
	}

	err = os.RemoveAll(fullPath)
	if err != nil {
		return fmt.Errorf("failed to delete: %v", err)
	}

	return nil
}

func (f *fileClient) MovePath(source, destination string) error {
	sourcePath, err := f.sanitizePath(source)
	if err != nil {
		return err
	}

	destPath, err := f.sanitizePath(destination)
	if err != nil {
		return err
	}

	err = os.Rename(sourcePath, destPath)
	if err != nil {
		return fmt.Errorf("failed to move: %v", err)
	}

	return nil
}

func (f *fileClient) DownloadFile(path string, writer io.Writer) error {
	if path == "" {
		return fmt.Errorf("path is required")
	}

	fullPath, err := f.sanitizePath(path)
	if err != nil {
		return err
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return fmt.Errorf("failed to get file info: %v", err)
	}

	if info.IsDir() {
		return createZipFromDir(writer, fullPath)
	}

	file, err := os.Open(fullPath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(writer, file)
	return err
}

func (f *fileClient) UploadFile(destination string, filename string, file io.Reader) error {
	fullPath, err := f.sanitizePath(destination)
	if err != nil {
		return err
	}

	// Create destination directory if it doesn't exist
	err = os.MkdirAll(fullPath, 0755)
	if err != nil {
		return fmt.Errorf("failed to create directory: %v", err)
	}

	filePath := filepath.Join(fullPath, filename)

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	// Copy the uploaded file
	_, err = io.Copy(dst, file)
	if err != nil {
		return fmt.Errorf("failed to save file: %v", err)
	}

	// Check if the file is a zip file
	mime, err := mimetype.DetectFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to detect file type: %v", err)
	}

	if mime.String() == "application/zip" {
		// Extract the zip file
		err = extractZip(filePath, fullPath)
		if err != nil {
			// Clean up the zip file if extraction fails
			os.Remove(filePath)
			return fmt.Errorf("failed to extract zip file: %v", err)
		}
		// Remove the original zip file after successful extraction
		os.Remove(filePath)
	}

	return nil
}

func (f *fileClient) sanitizePath(requestPath string) (string, error) {
	// Join the base directory with the requested path
	fullPath := filepath.Join(f.baseDir, requestPath)

	// Clean the path to remove any ".." or "." components
	fullPath = filepath.Clean(fullPath)

	// Check if the resulting path is within the shared directory
	if !strings.HasPrefix(fullPath, f.baseDir) {
		return "", fmt.Errorf("access denied: path outside base directory")
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
			if err != nil {
				return err
			}
		}
		return err
	})

	return err
}

func extractZip(zipFile string, destination string) error {
	reader, err := zip.OpenReader(zipFile)
	if err != nil {
		return err
	}
	defer reader.Close()

	for _, file := range reader.File {
		// Sanitize file path to prevent zip slip
		filePath := filepath.Join(destination, file.Name)
		if !strings.HasPrefix(filePath, destination) {
			continue // Skip files that would be extracted outside destination
		}

		if file.FileInfo().IsDir() {
			os.MkdirAll(filePath, 0755)
			continue
		}

		// Create directory for file if it doesn't exist
		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			return err
		}

		// Create file
		dstFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			return err
		}

		// Open file in zip
		srcFile, err := file.Open()
		if err != nil {
			dstFile.Close()
			return err
		}

		// Copy contents
		_, err = io.Copy(dstFile, srcFile)
		dstFile.Close()
		srcFile.Close()
		if err != nil {
			return err
		}
	}

	return nil
}
