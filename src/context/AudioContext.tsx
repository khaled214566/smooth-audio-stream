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

/**
 * Generates a full random permutation of indices.
 */
function buildShuffleOrder(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

type RepeatMode = "off" | "all" | "one";

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
  playbackDuration: number;
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
  const [currentIndex, setCurrentIndex] = useState(0); // Index in the original queue
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.75);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [trackTags, setTrackTags] = useState<Record<string, TrackMediaTags>>({});

  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePosRef = useRef<number>(0); // Current position in the shuffleOrder array

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackTagsRef = useRef(trackTags);
  const nextSongRef = useRef<() => void>(() => {});
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const currentSongRef = useRef<Song | null>(null);

  trackTagsRef.current = trackTags;
  currentSongRef.current = currentSong;
  repeatModeRef.current = repeatMode;

  // Initialize audio library
  useEffect(() => {
    const libraryService = AudioLibraryService.getInstance();
    libraryService.initialize().catch(console.error);

    const unsubscribe = libraryService.subscribe((librarySongs) => {
      setSongs(librarySongs);
      let cancelled = false;
      librarySongs.forEach((song) => {
        if (!song.audioSrc) return;
        readAudioTags(song.audioSrc).then((tags) => {
          if (cancelled) {
            if (tags.artworkObjectUrl) URL.revokeObjectURL(tags.artworkObjectUrl);
            return;
          }
          setTrackTags((prev) => {
            const oldArt = prev[song.id]?.artworkObjectUrl;
            if (oldArt && oldArt !== tags.artworkObjectUrl) URL.revokeObjectURL(oldArt);
            return { ...prev, [song.id]: tags };
          });
        }).catch(() => {});
      });
      return () => { cancelled = true; };
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
    setPlaybackDuration(currentSong?.duration ?? 0);
  }, [currentSong?.id, currentSong?.duration]);

  const nextSong = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === "one") {
      const a = audioRef.current;
      if (a) a.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let nextIdx: number;

    if (shuffle) {
      // Move to next position in shuffle list
      const nextPos = shufflePosRef.current + 1;
      
      // If we reach the end of the set
      if (nextPos >= shuffleOrderRef.current.length) {
        if (repeatMode === "off") {
          setIsPlaying(false);
          return;
        }
        // Repeat the existing shuffle set from start
        shufflePosRef.current = 0;
      } else {
        shufflePosRef.current = nextPos;
      }
      nextIdx = shuffleOrderRef.current[shufflePosRef.current];
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

  const prevSong = useCallback(() => {
    if (currentTime > 3) {
      const a = audioRef.current;
      if (a) a.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIdx: number;

    if (shuffle) {
      // Wrap backward to end if at start (Continuous loop)
      const prevPos = (shufflePosRef.current - 1 + shuffleOrderRef.current.length) % shuffleOrderRef.current.length;
      shufflePosRef.current = prevPos;
      prevIdx = shuffleOrderRef.current[prevPos];
    } else {
      prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    }

    setCurrentIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, currentTime, shuffle]);

  // Audio Engine Management
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
      if (repeatModeRef.current === "one") {
        a.currentTime = 0;
        setCurrentTime(0);
        void a.play().catch(() => setIsPlaying(false));
      } else {
        nextSongRef.current();
      }
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
    if (!currentSong?.audioSrc || !audioRef.current) return;
    if (isPlaying) {
      void audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
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

    // Create a new full shuffle order
    const order = buildShuffleOrder(newQueue.length);
    // Sync the current pointer to wherever the clicked song ended up in the shuffle
    const posInShuffle = order.indexOf(startIndex);
    
    shuffleOrderRef.current = order;
    shufflePosRef.current = posInShuffle;
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const seekTo = useCallback((time: number) => {
    const dur = playbackDuration > 0 ? playbackDuration : currentSongRef.current?.duration ?? 0;
    const clamped = Math.max(0, Math.min(time, dur));
    setCurrentTime(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  }, [playbackDuration]);

  const setVolume = useCallback((vol: number) => setVolumeState(vol), []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const next = !s;
      if (next && queue.length > 0) {
        const order = buildShuffleOrder(queue.length);
        shuffleOrderRef.current = order;
        shufflePosRef.current = order.indexOf(currentIndex);
      }
      return next;
    });
  }, [queue.length, currentIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((m) => m === "off" ? "all" : m === "all" ? "one" : "off");
  }, []);

  const toggleFavorite = useCallback((songId: string) => {
    const libraryService = AudioLibraryService.getInstance();
    const song = libraryService.getSongs().find((s) => s.id === songId);
    if (!song) return;

    const newFav = !song.isFavorite;
    libraryService.updateSong(songId, { isFavorite: newFav });

    if (currentSongRef.current?.id === songId) {
      setCurrentSong((prev) => prev ? { ...prev, isFavorite: newFav } : null);
    }
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    // Note: In a real app, you'd want to add this new song index to shuffleOrder too
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        currentSong, isPlaying, queue, currentTime, playbackDuration,
        trackTags, volume, shuffle, repeatMode, songs,
        playSong, playQueue, togglePlay, nextSong, prevSong,
        seekTo, setVolume, toggleShuffle, toggleRepeat,
        toggleFavorite, addToQueue, removeFromQueue,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};