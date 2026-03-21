import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Song, demoSongs } from "@/data/demoData";

type RepeatMode = "off" | "all" | "one";

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
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
  const [songs, setSongs] = useState<Song[]>(demoSongs);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.75);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  // Simulate time progression
  React.useEffect(() => {
    if (!isPlaying || !currentSong) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= currentSong.duration) {
          nextSong();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

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

  const nextSong = useCallback(() => {
    if (queue.length === 0) return;
    if (repeatMode === "one") {
      setCurrentTime(0);
      return;
    }
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === "all") nextIdx = 0;
        else { setIsPlaying(false); return; }
      }
    }
    setCurrentIndex(nextIdx);
    setCurrentSong(queue[nextIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, shuffle, repeatMode]);

  const prevSong = useCallback(() => {
    if (currentTime > 3) { setCurrentTime(0); return; }
    if (queue.length === 0) return;
    const prevIdx = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setCurrentTime(0);
  }, [queue, currentIndex, currentTime]);

  const seekTo = useCallback((time: number) => setCurrentTime(time), []);
  const setVolume = useCallback((vol: number) => setVolumeState(vol), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const toggleFavorite = useCallback((songId: string) => {
    setSongs((prev) => prev.map((s) => s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s));
    if (currentSong?.id === songId) {
      setCurrentSong((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  }, [currentSong]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <AudioCtx.Provider value={{
      currentSong, isPlaying, queue, currentTime, volume, shuffle, repeatMode, songs,
      playSong, playQueue, togglePlay, nextSong, prevSong, seekTo, setVolume,
      toggleShuffle, toggleRepeat, toggleFavorite, addToQueue, removeFromQueue,
    }}>
      {children}
    </AudioCtx.Provider>
  );
};
