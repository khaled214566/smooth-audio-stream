import { useState, useEffect } from "react";
import { Download, Link, FileAudio, FileVideo, Settings2, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioLibraryService } from "@/lib/audioLibraryService";
import { toast } from "sonner";

interface DownloadItem {
  id: string;
  title: string;
  status: "downloading" | "complete" | "error";
  progress: number;
  format: string;
  filename?: string;
  publicPath?: string;
  error?: string;
}

const ConverterPage = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("320");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing downloads on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/downloads');
      if (response.ok) {
        const allDownloads = await response.json();
        setDownloads(allDownloads);
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/download', {
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

      const downloadInfo = await response.json();
      
      // Start polling for status updates
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`http://localhost:3001/api/download/status/${downloadInfo.downloadId}`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            
            setDownloads(prev => {
              const existing = prev.findIndex(d => d.id === status.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = status;
                return updated;
              } else {
                return [...prev, status];
              }
            });

            if (status.status === 'complete') {
              toast.success(`Downloaded: ${status.title}`);
              
              // Refresh the library to include the new song
              const libraryService = AudioLibraryService.getInstance();
              libraryService.refresh().then(() => {
                console.log('Library refreshed with new song');
              }).catch(error => {
                console.error('Failed to refresh library:', error);
              });
            } else if (status.status === 'error') {
              toast.error(`Download failed: ${status.error}`);
            } else if (status.status === 'downloading') {
              // Continue polling
              setTimeout(pollStatus, 1000);
            }
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      };

      // Start polling
      setTimeout(pollStatus, 1000);

      setUrl("");
      toast.success("Download started");
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Download className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Media Converter</h1>
            <p className="text-muted-foreground">Download and convert media with yt-dlp</p>
          </div>
        </div>
      </motion.div>

      {/* Status Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Real Downloads Enabled</h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              Download functionality is now working with yt-dlp. Files will be saved to public/audio/ and appear in your library.
            </p>
          </div>
        </div>
      </motion.div>

      {/* URL input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-6 mb-6 border border-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <Link className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Paste URL</h2>
        </div>
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-secondary border-none"
          />
          <Button onClick={handleDownload} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Starting..." : "Download"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-secondary border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3 (Audio)</SelectItem>
                <SelectItem value="m4a">M4A (Audio)</SelectItem>
                <SelectItem value="wav">WAV (Audio)</SelectItem>
                <SelectItem value="mp4">MP4 (Video)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quality</label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-secondary border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128 kbps</SelectItem>
                <SelectItem value="192">192 kbps</SelectItem>
                <SelectItem value="256">256 kbps</SelectItem>
                <SelectItem value="320">320 kbps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-4 w-4" /> Advanced
            </button>
          </div>
        </div>
      </motion.div>

      {/* Download history */}
      <h2 className="text-xl font-bold text-foreground mb-4">Download History</h2>
      <div className="space-y-3">
        {downloads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileAudio className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No downloads yet. Start by pasting a URL above.</p>
          </div>
        ) : (
          downloads.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                {item.format.includes("MP4") ? (
                  <FileVideo className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FileAudio className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.format}</p>
                {item.status === "downloading" && (
                  <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : item.status === "error" ? (
                  <X className="h-5 w-5 text-red-500" />
                ) : (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {(item.status === "complete" || item.status === "error") && (
                  <button
                    onClick={() => removeDownload(item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConverterPage;
