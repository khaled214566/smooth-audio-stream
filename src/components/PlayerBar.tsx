import { useAudio } from "@/context/AudioContext";
import { formatDuration } from "@/data/demoData";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, Heart, ListMusic
} from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const PlayerBar = () => {
  const {
    currentSong, isPlaying, currentTime, playbackDuration, trackTags, volume, shuffle, repeatMode,
    togglePlay, nextSong, prevSong, seekTo, setVolume, toggleShuffle,
    toggleRepeat, toggleFavorite, songs,
  } = useAudio();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) return null;

  const actualSong = songs.find((s) => s.id === currentSong.id) || currentSong;
  const meta = trackTags[currentSong.id];
  const displayTitle = meta?.title ?? currentSong.title;
  const displayArtist = meta?.artist ?? currentSong.artist;
  const displayAlbum = meta?.album;
  const displayArtwork = meta?.artworkObjectUrl ?? currentSong.artwork;
  const dur = playbackDuration > 0 ? playbackDuration : currentSong.duration;
  const progress = dur > 0 ? (currentTime / dur) * 100 : 0;
  const metaLine = [meta?.track && `Track ${meta.track}`, meta?.year, meta?.genre].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-player backdrop-blur-xl"
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-secondary cursor-pointer" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        seekTo(Math.floor(pct * dur));
      }}>
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        {/* Song info */}
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[30%]">
          <motion.img
            key={`${currentSong.id}-${displayArtwork}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={displayArtwork}
            alt={displayTitle}
            className="w-12 h-12 rounded-lg object-cover shadow-lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">{displayTitle}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{displayArtist}</p>
            {displayAlbum ? (
              <p className="text-[10px] text-muted-foreground/90 line-clamp-1">{displayAlbum}</p>
            ) : null}
            {meta?.albumArtist ? (
              <p className="hidden sm:block text-[10px] text-muted-foreground/70 line-clamp-1">{meta.albumArtist}</p>
            ) : null}
            {metaLine ? (
              <p className="hidden md:block text-[10px] text-muted-foreground/60 line-clamp-1">{metaLine}</p>
            ) : null}
            {meta?.composer ? (
              <p className="hidden lg:block text-[10px] text-muted-foreground/60 line-clamp-1">Composer: {meta.composer}</p>
            ) : null}
            {meta?.comment ? (
              <p className="hidden xl:block text-[10px] text-muted-foreground/50 line-clamp-2" title={meta.comment}>{meta.comment}</p>
            ) : null}
          </div>
          <button onClick={() => toggleFavorite(currentSong.id)} className="hidden sm:block">
            <Heart className={`h-4 w-4 transition-colors ${actualSong.isFavorite ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleShuffle} className={`hidden sm:block transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Shuffle className="h-4 w-4" />
            </button>
            <button onClick={prevSong} className="text-foreground hover:text-primary transition-colors">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-background" />
              ) : (
                <Play className="h-4 w-4 text-background ml-0.5" />
              )}
            </button>
            <button onClick={nextSong} className="text-foreground hover:text-primary transition-colors">
              <SkipForward className="h-5 w-5" />
            </button>
            <button onClick={toggleRepeat} className={`hidden sm:block transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground w-full max-w-md">
            <span className="w-10 text-right">{formatDuration(Math.floor(currentTime))}</span>
            <Slider
              value={[currentTime]}
              max={dur}
              step={1}
              onValueChange={(v) => seekTo(v[0])}
              className="flex-1"
            />
            <span className="w-10">{formatDuration(dur)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-end max-w-[30%]">
          <button onClick={() => setShowQueue(!showQueue)}>
            <ListMusic className={`h-4 w-4 transition-colors ${showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
          <button onClick={() => setVolume(volume > 0 ? 0 : 0.75)}>
            {volume === 0 ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
          </button>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0] / 100)}
            className="w-24"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerBar;
