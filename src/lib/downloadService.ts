const API_BASE_URL = 'http://localhost:3001/api';

export interface DownloadInfo {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
}

export interface DownloadStatus {
  id: string;
  title: string;
  status: 'downloading' | 'complete' | 'error';
  progress: number;
  format: string;
  filename?: string;
  publicPath?: string;
  error?: string;
}

export interface AudioFile {
  filename: string;
  publicPath: string;
  size: number;
  modified: string;
}

export class DownloadService {
  // Test server connection
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      return response.ok;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  }

  // Start a new download
  static async startDownload(url: string, format: string = 'mp3', quality: string = '320'): Promise<DownloadInfo> {
    // Test connection first
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Backend server is not running. Please start the server with "npm run server"');
    }

    const response = await fetch(`${API_BASE_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, format, quality }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start download');
    }

    return response.json();
  }

  // Get download status
  static async getDownloadStatus(id: string): Promise<DownloadStatus> {
    const response = await fetch(`${API_BASE_URL}/download/status/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to get download status');
    }

    return response.json();
  }

  // Get all downloads
  static async getAllDownloads(): Promise<DownloadStatus[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/downloads`);
      
      if (!response.ok) {
        throw new Error('Failed to get downloads');
      }

      return response.json();
    } catch (error) {
      // If server is not running, return empty array
      console.warn('Could not fetch downloads, server may be offline:', error);
      return [];
    }
  }

  // Scan audio directory
  static async scanAudioDirectory(): Promise<AudioFile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/scan`);
      
      if (!response.ok) {
        throw new Error('Failed to scan audio directory');
      }

      return response.json();
    } catch (error) {
      console.warn('Could not scan audio directory, server may be offline:', error);
      return [];
    }
  }

  // Poll download status
  static pollDownloadStatus(id: string, onStatus: (status: DownloadStatus) => void, interval: number = 1000): () => void {
    const poll = async () => {
      try {
        const status = await this.getDownloadStatus(id);
        onStatus(status);
        
        if (status.status === 'complete' || status.status === 'error') {
          return;
        }
        
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();

    return () => {
      // Cleanup function if needed
    };
  }
}
