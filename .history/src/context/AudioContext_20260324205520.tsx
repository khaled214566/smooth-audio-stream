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

// Fisher-Yates shuffle — returns a new shuffled array, never mutates input
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  // --- Shuffle refs (avoids stale closures inside audio event listeners) ---
  const shuffledQueueRef = useRef<Song[]>([]);
  const shuffledIndexRef = useRef(0);
  // History stack for prevSong support in shuffle mode
  const shuffleHistoryRef = useRef<Song[]>([]);

  const nextSongRef = useRef<() => void>(() => {});
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const currentSongRef = useRef<Song | null>(null);
  const shuffleRef = useRef(shuffle);
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);

  currentSongRef.current = currentSong;
  repeatModeRef.current = repeatMode;
  shuffleRef.current = shuffle;
  queueRef.current = queue;
  currentIndexRef.current = currentIndex;

  // Initialize audio library
  useEffect(() => {
    const libraryService = AudioLibraryService.getInstance();

    libraryService.initialize().then(() => {
      console.log("Audio library initialized");
    }).catch((error) => {
      console.error("Failed to initialize audio library:", error);
    });

    const unsubscribe = libraryService.subscribe((librarySongs) => {
      setSongs(librarySongs);

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

  // ------------------------------------------------------------------
  // nextSong — walks shuffledQueue linearly when shuffle is on
  // ------------------------------------------------------------------
  const nextSong = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    if (repeatModeRef.current === "one") {
      setCurrentTime(0);
      const a = audioRef.current;
      if (currentSongRef.current?.audioSrc && a) {
        a.currentTime = 0;
      }
      return;
    }

    if (shuffleRef.current) {
      const sq = shuffledQueueRef.current;
      let nextShuffledIdx = shuffledIndexRef.current + 1;

      if (nextShuffledIdx >= sq.length) {
        if (repeatModeRef.current === "all") {
          // Re-shuffle for next cycle, avoid starting with same song
          shuffledQueueRef.current = shuffleArray(q);
          nextShuffledIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      // Push current song onto history before advancing
      if (currentSongRef.current) {
        shuffleHistoryRef.current.push(currentSongRef.current);
      }

      shuffledIndexRef.current = nextShuffledIdx;
      const nextTrack = shuffledQueueRef.current[nextShuffledIdx];
      const realIdx = q.findIndex((s) => s.id === nextTrack.id);
      setCurrentIndex(realIdx !== -1 ? realIdx : nextShuffledIdx);
      setCurrentSong(nextTrack);
      setCurrentTime(0);
      return;
    }

    // Non-shuffle path
    let nextIdx = currentIndexRef.current + 1;
    if (nextIdx >= q.length) {
      if (repeatModeRef.current === "all") nextIdx = 0;
      else {
        setIsPlaying(false);
        return;
      }
    }
    setCurrentIndex(nextIdx);
    setCurrentSong(q[nextIdx]);
    setCurrentTime(0);
  }, []);

  nextSongRef.current = nextSong;

  // Simulated time progression for demo songs (no real audio src)
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

  // ------------------------------------------------------------------
  // playSong
  // ------------------------------------------------------------------
  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
  }, []);

  // ------------------------------------------------------------------
  // playQueue — rebuilds shuffle state when shuffle is already on
  // ------------------------------------------------------------------
  const playQueue = useCallback((newQueue: Song[], startIndex = 0) => {
    setQueue(newQueue);
    setCurrentIndex(startIndex);
    setCurrentSong(newQueue[startIndex]);
    setIsPlaying(true);
    setCurrentTime(0);

    if (shuffleRef.current && newQueue.length > 0) {
      const rest = newQueue.filter((_, i) => i !== startIndex);
      shuffledQueueRef.current = [newQueue[startIndex], ...shuffleArray(rest)];
      shuffledIndexRef.current = 0;
      shuffleHistoryRef.current = [];
    }
  }, []);

  // ------------------------------------------------------------------
  // togglePlay
  // ------------------------------------------------------------------
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  // ------------------------------------------------------------------
  // prevSong — pops from shuffle history when shuffle is on
  // ------------------------------------------------------------------
  const prevSong = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
      const a = audioRef.current;
      if (currentSongRef.current?.audioSrc && a) {
        a.currentTime = 0;
      }
      return;
    }

    if (shuffleRef.current) {
      const history = shuffleHistoryRef.current;
      if (history.length === 0) {
        // Nothing to go back to — just restart current song
        setCurrentTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        return;
      }
      const prevTrack = history.pop()!;
      shuffleHistoryRef.current = [...history];
      shuffledIndexRef.current = Math.max(0, shuffledIndexRef.current - 1);
      const realIdx = queueRef.current.findIndex((s) => s.id === prevTrack.id);
      setCurrentIndex(realIdx !== -1 ? realIdx : 0);
      setCurrentSong(prevTrack);
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;
    const prevIdx = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, currentTime]);

  // ------------------------------------------------------------------
  // seekTo
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // toggleShuffle — builds/clears shuffled queue immediately
  // ------------------------------------------------------------------
  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const next = !s;
      const q = queueRef.current;
      const idx = currentIndexRef.current;

      if (next && q.length > 0) {
        // Put current song first, shuffle the rest
        const rest = q.filter((_, i) => i !== idx);
        shuffledQueueRef.current = [q[idx], ...shuffleArray(rest)];
        shuffledIndexRef.current = 0;
        shuffleHistoryRef.current = [];
      } else {
        // Clear shuffle state when turning off
        shuffledQueueRef.current = [];
        shuffledIndexRef.current = 0;
        shuffleHistoryRef.current = [];
      }

      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // toggleRepeat
  // ------------------------------------------------------------------
  const toggleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  // ------------------------------------------------------------------
  // toggleFavorite
  // ------------------------------------------------------------------
  const toggleFavorite = useCallback((songId: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
    if (currentSong?.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  }, [currentSong]);

  // ------------------------------------------------------------------
  // addToQueue / removeFromQueue
  // ------------------------------------------------------------------
  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      const updated = [...prev, song];
      // If shuffle is on, also append to shuffled queue at a random position
      if (shuffleRef.current) {
        const sq = shuffledQueueRef.current;
        const insertAt = Math.floor(Math.random() * (sq.length - shuffledIndexRef.current)) + shuffledIndexRef.current + 1;
        const newSq = [...sq];
        newSq.splice(insertAt, 0, song);
        shuffledQueueRef.current = newSq;
      }
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      // Mirror removal in shuffled queue
      if (shuffleRef.current && removed) {
        shuffledQueueRef.current = shuffledQueueRef.current.filter((s) => s.id !== removed.id);
      }
      return updated;
    });
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