import { useState } from "react";
import { Download, Link, FileAudio, FileVideo, Settings2, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DownloadItem {
  id: string;
  title: string;
  status: "downloading" | "complete" | "error";
  progress: number;
  format: string;
}

const ConverterPage = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("320");
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    { id: "1", title: "Lo-Fi Chill Beat - Relaxing Mix", status: "complete", progress: 100, format: "MP3" },
    { id: "2", title: "Ambient Space Sounds", status: "downloading", progress: 67, format: "M4A" },
  ]);

  const handleDownload = () => {
    if (!url.trim()) return;
    const newItem: DownloadItem = {
      id: Date.now().toString(),
      title: url.includes("youtube") ? "YouTube Video" : "Media File",
      status: "downloading",
      progress: 0,
      format: format.toUpperCase(),
    };
    setDownloads((prev) => [newItem, ...prev]);
    setUrl("");

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloads((prev) =>
          prev.map((d) => (d.id === newItem.id ? { ...d, status: "complete", progress: 100 } : d))
        );
      } else {
        setDownloads((prev) =>
          prev.map((d) => (d.id === newItem.id ? { ...d, progress: Math.min(progress, 99) } : d))
        );
      }
    }, 500);
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
          <Button onClick={handleDownload} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" /> Download
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
        {downloads.map((item, i) => (
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
            </div>
            <div>
              {item.status === "complete" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ConverterPage;
