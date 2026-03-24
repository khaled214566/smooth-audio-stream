import { useAudio } from "@/context/AudioContext";
import { formatDuration, Song } from "@/data/demoData";
import { Heart, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

interface SongRowProps {
  song: Song;
  index: number;
  showAlbum?: boolean;
}

const SongRow = ({ song, index, showAlbum = true }: SongRowProps) => {
  const { currentSong, isPlaying, togglePlay, toggleFavorite, songs, playQueue, trackTags } = useAudio();

  const isActive = currentSong?.id === song.id;
  const actualSong = songs.find((s) => s.id === song.id) || song;
  const meta = trackTags[song.id];
  const rowTitle = meta?.title ?? song.title;
  const rowArtist = meta?.artist ?? song.artist;
  const rowAlbum = meta?.album ?? song.album;
  const rowArtwork = meta?.artworkObjectUrl ?? song.artwork;

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      const allSongs = songs;
      const idx = allSongs.findIndex((s) => s.id === song.id);
      playQueue(allSongs, idx >= 0 ? idx : 0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleClick}
      className={`group flex items-center gap-4 px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-secondary"
      }`}
    >
      <div className="w-8 text-center">
        {isActive && isPlaying ? (
          <div className="flex items-center justify-center gap-0.5">
            <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse-glow" />
            <span className="w-0.5 h-4 bg-primary rounded-full animate-pulse-glow" style={{ animationDelay: "0.2s" }} />
            <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground group-hover:hidden">{index + 1}</span>
        )}
        {!(isActive && isPlaying) && (
          <Play className="h-4 w-4 text-foreground hidden group-hover:block mx-auto" />
        )}
      </div>

      <img src={rowArtwork} alt={rowTitle} className="w-10 h-10 rounded object-cover" />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium line-clamp-1 ${isActive ? "text-primary" : "text-foreground"}`}>
          {rowTitle}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">{rowArtist}</p>
      </div>

      {showAlbum && (
        <span className="hidden md:block text-sm text-muted-foreground flex-1 line-clamp-1">{rowAlbum}</span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Heart className={`h-4 w-4 ${actualSong.isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      </button>

      <span className="text-sm text-muted-foreground w-12 text-right">{formatDuration(song.duration)}</span>
    </motion.div>
  );
};

export default SongRow;
