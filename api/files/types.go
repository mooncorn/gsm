package files

import "time"

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
