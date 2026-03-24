import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import { Song } from "@/data/demoData";
import { readAudioTags, type TrackMediaTags } from "@/lib/readAudioTags";
import { AudioLibraryService } from "@/lib/audioLibraryService";

type RepeatMode = "off" | "all" | "one";

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
  /** Duration for UI (from file metadata when using real audio, else song.duration). */
  playbackDuration: number;
  /** ID3 / file tags from jsmediatags, keyed by song id (when loaded). */
  trackTags: Record<string, TrackMediaTags>;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  songs: Song[];
  playSong: (song: Song) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (songId: string) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.75);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [trackTags, setTrackTags] = useState<Record<string, TrackMediaTags>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackTagsRef = useRef(trackTags);
  trackTagsRef.current = trackTags;
  const nextSongRef = useRef<() => void>(() => {});
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const currentSongRef = useRef<Song | null>(null);

  currentSongRef.current = currentSong;
  repeatModeRef.current = repeatMode;

  // Initialize audio library
  useEffect(() => {
    const libraryService = AudioLibraryService.getInstance();
    
    // Initialize the library
    libraryService.initialize().then(() => {
      console.log('Audio library initialized');
    }).catch(error => {
      console.error('Failed to initialize audio library:', error);
    });

    // Subscribe to song updates
    const unsubscribe = libraryService.subscribe((librarySongs) => {
      setSongs(librarySongs);
      
      // Load tags for new songs
      let cancelled = false;
      librarySongs.forEach((song) => {
        if (!song.audioSrc) return;
        readAudioTags(song.audioSrc)
          .then((tags) => {
            if (cancelled) {
              if (tags.artworkObjectUrl) URL.revokeObjectURL(tags.artworkObjectUrl);
              return;
            }
            setTrackTags((prev) => {
              const oldArt = prev[song.id]?.artworkObjectUrl;
              if (oldArt && oldArt !== tags.artworkObjectUrl) URL.revokeObjectURL(oldArt);
              return { ...prev, [song.id]: tags };
            });
          })
          .catch(() => {});
      });

      return () => {
        cancelled = true;
      };
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      Object.values(trackTagsRef.current).forEach((t) => {
        if (t?.artworkObjectUrl) URL.revokeObjectURL(t.artworkObjectUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (currentSong) setPlaybackDuration(currentSong.duration);
    else setPlaybackDuration(0);
  }, [currentSong?.id, currentSong?.duration]);

  const nextSong = useCallback(() => {
    if (queue.length === 0) return;
    if (repeatMode === "one") {
      setCurrentTime(0);
      const a = audioRef.current;
      if (currentSongRef.current?.audioSrc && a) {
        a.currentTime = 0;
      }
      return;
    }
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === "all") nextIdx = 0;
        else {
          setIsPlaying(false);
          return;
        }
      }
    }
    setCurrentIndex(nextIdx);
    setCurrentSong(queue[nextIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, shuffle, repeatMode]);

  nextSongRef.current = nextSong;

  useEffect(() => {
    if (!isPlaying || !currentSong || currentSong.audioSrc) return;
    const dur = currentSong.duration;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= dur) {
          nextSongRef.current();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentSong?.id, currentSong?.audioSrc, currentSong?.duration]);

  useEffect(() => {
    if (currentSong?.audioSrc) return;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
  }, [currentSong?.id, currentSong?.audioSrc]);

  useEffect(() => {
    if (!currentSong?.audioSrc) return;

    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.volume = volume;
    a.src = currentSong.audioSrc;
    a.load();

    const onTimeUpdate = () => setCurrentTime(a.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setPlaybackDuration(Math.floor(a.duration));
      }
    };
    const onEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === "one") {
        a.currentTime = 0;
        setCurrentTime(0);
        void a.play().catch(() => setIsPlaying(false));
        return;
      }
      nextSongRef.current();
    };

    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
      a.removeEventListener("ended", onEnded);
      a.pause();
    };
  }, [currentSong?.id, currentSong?.audioSrc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!currentSong?.audioSrc) return;
    const a = audioRef.current;
    if (!a?.src) return;
    if (isPlaying) {
      void a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, currentSong?.id, currentSong?.audioSrc]);

  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
  }, []);

  const playQueue = useCallback((newQueue: Song[], startIndex = 0) => {
    setQueue(newQueue);
    setCurrentIndex(startIndex);
    setCurrentSong(newQueue[startIndex]);
    setIsPlaying(true);
    setCurrentTime(0);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const prevSong = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
      const a = audioRef.current;
      if (currentSongRef.current?.audioSrc && a) {
        a.currentTime = 0;
      }
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, currentTime]);

  const seekTo = useCallback((time: number) => {
    const dur = playbackDuration > 0 ? playbackDuration : currentSongRef.current?.duration ?? 0;
    const clamped = Math.max(0, Math.min(time, dur || time));
    setCurrentTime(clamped);
    const song = currentSongRef.current;
    if (song?.audioSrc && audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  }, [playbackDuration]);

  const setVolume = useCallback((vol: number) => setVolumeState(vol), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const toggleFavorite = useCallback((songId: string) => {
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s)));
    if (currentSong?.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  }, [currentSong]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        currentSong,
        isPlaying,
        queue,
        currentTime,
        playbackDuration,
        trackTags,
        volume,
        shuffle,
        repeatMode,
        songs,
        playSong,
        playQueue,
        togglePlay,
        nextSong,
        prevSong,
        seekTo,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};
