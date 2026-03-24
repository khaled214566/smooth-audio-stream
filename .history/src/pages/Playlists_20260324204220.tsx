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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Music className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
              <p className="text-muted-foreground">Create and manage your playlists</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>
      </motion.div>

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Playlist</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Playlist Name</label>
                <Input
                  placeholder="Enter playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-secondary border-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Input
                  placeholder="Enter playlist description..."
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="bg-secondary border-none"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createPlaylist}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Song Selection Controls */}
      {editingPlaylist && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedSongs.length} song(s) selected
              </span>
              <Button variant="ghost" size="sm" onClick={selectAllSongs}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingPlaylist(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => addSongsToPlaylist(editingPlaylist)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add to Playlist
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist, index) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {playlist.songIds.length} song(s)
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => playPlaylist(playlist)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingPlaylist(
                        editingPlaylist === playlist.id ? null : playlist.id
                      );
                      setSelectedSongs([]);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {editingPlaylist === playlist.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg p-1 z-10 min-w-[150px]"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlaylist(playlist.id)}
                        className="w-full justify-start"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Add Songs
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlaylist(playlist.id)}
                        className="w-full justify-start text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Playlist Songs */}
            <div className="space-y-2">
              {getPlaylistSongs(playlist).slice(0, 3).map((song) => (
                <div key={song.id} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={song.artwork} 
                      alt={song.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-muted-foreground truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
              
              {playlist.songIds.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{playlist.songIds.length - 3} more songs
                </p>
              )}
            </div>

            {/* Song Management */}
            {editingPlaylist === playlist.id && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium mb-2">Playlist Songs</h4>
                {getPlaylistSongs(playlist).map((song) => (
                  <div key={song.id} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <img 
                          src={song.artwork} 
                          alt={song.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {playlists.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Playlists Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first playlist to organize your music
          </p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Playlist
          </Button>
        </motion.div>
      )}

      {/* Song Selection Modal */}
      {editingPlaylist && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Select Songs to Add</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {songs.map((song) => (
              <div 
                key={song.id}
                className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => toggleSongSelection(song.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedSongs.includes(song.id)}
                  onChange={() => toggleSongSelection(song.id)}
                  className="w-4 h-4"
                />
                
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={song.artwork} 
                    alt={song.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.artist} • {song.album}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
