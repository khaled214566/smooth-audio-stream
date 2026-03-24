import { useState, useEffect } from "react";
import { Plus, Play, MoreHorizontal, Trash2, Edit2, X, Music } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/context/AudioContext";
import StorageService, { type Playlist } from "@/lib/storageService";
import { toast } from "sonner";

const PlaylistsPage = () => {
  const { songs, playQueue } = useAudio();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  // Load playlists on mount
  useEffect(() => {
    setPlaylists(StorageService.getPlaylists());
  }, []);

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    const playlist = StorageService.createPlaylist(newPlaylistName, newPlaylistDescription);
    setPlaylists(prev => [...prev, playlist]);
    
    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setIsCreateModalOpen(false);
    
    toast.success("Playlist created successfully");
  };

  const deletePlaylist = (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    
    const success = StorageService.deletePlaylist(playlistId);
    if (success) {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast.success("Playlist deleted");
    } else {
      toast.error("Failed to delete playlist");
    }
  };

  const addSongsToPlaylist = (playlistId: string) => {
    if (selectedSongs.length === 0) {
      toast.error("Please select songs to add");
      return;
    }

    const success = StorageService.addSongsToPlaylist(playlistId, selectedSongs);
    if (success) {
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, songIds: [...p.songIds, ...selectedSongs] }
          : p
      ));
      setSelectedSongs([]);
      toast.success(`Added ${selectedSongs.length} song(s) to playlist`);
    } else {
      toast.error("Failed to add songs to playlist");
    }
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    const success = StorageService.removeSongsFromPlaylist(playlistId, [songId]);
    if (success) {
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, songIds: p.songIds.filter(id => id !== songId) }
          : p
      ));
      toast.success("Song removed from playlist");
    }
  };

  const playPlaylist = (playlist: Playlist) => {
    const playlistSongs = songs.filter(song => playlist.songIds.includes(song.id));
    if (playlistSongs.length > 0) {
      playQueue(playlistSongs);
      toast.success(`Playing: ${playlist.name}`);
    } else {
      toast.error("Playlist is empty");
    }
  };

  const getPlaylistSongs = (playlist: Playlist) => {
    return songs.filter(song => playlist.songIds.includes(song.id));
  };

  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const selectAllSongs = () => {
    setSelectedSongs(songs.map(song => song.id));
  };

  const clearSelection = () => {
    setSelectedSongs([]);
  };

  // Generate default artwork for playlists
  const getPlaylistArtwork = (playlist: Playlist) => {
    const playlistSongs = getPlaylistSongs(playlist);
    if (playlistSongs.length > 0) {
      return playlistSongs[0]?.artwork || "/assets/album-art-1.jpg";
    }
    return "/assets/album-art-1.jpg";
  };

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-5 w-5" /> Back to Playlists
            </button>

            <div className="flex items-end gap-6 mb-8">
              <img src={selected.artwork} alt={selected.name} className="w-48 h-48 rounded-2xl object-cover shadow-2xl" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Playlist</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{selected.name}</h1>
                <p className="text-muted-foreground">{selected.songIds.length} songs</p>
                <button
                  onClick={() => playQueue(getPlaylistSongs(selected))}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:scale-105 transition-transform"
                >
                  <Play className="h-5 w-5" /> Play All
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {getPlaylistSongs(selected).map((song, i) => (
                <SongRow key={song.id} song={song} index={i} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm font-medium">
                <Plus className="h-4 w-4" /> New Playlist
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {playlists.map((playlist, i) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(playlist)}
                  className="cursor-pointer group"
                >
                  <div className="relative mb-3">
                    <img src={playlist.artwork} alt={playlist.name} className="w-full aspect-square rounded-xl object-cover shadow-lg" />
                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-xl">
                      <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">{playlist.songIds.length} songs</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaylistsPage;
