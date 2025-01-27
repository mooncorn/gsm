export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modTime: string;
  permissions: string;
  isReadable: boolean;
  isWritable: boolean;
  isExecutable: boolean;
}

export interface FileOperationResponse {
  message: string;
}

export interface FileContentResponse {
  content: string;
}

export interface MoveFileRequest {
  source: string;
  destination: string;
}

export interface CreateDirectoryRequest {
  path: string;
}

export interface WriteFileRequest {
  path: string;
  content: string;
} 