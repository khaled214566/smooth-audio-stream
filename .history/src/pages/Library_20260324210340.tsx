import { useState, useEffect } from "react";
import { useAudio } from "@/context/AudioContext";
import SongRow from "@/components/SongRow";
import AudioLibraryService from "@/lib/audioLibraryService";
import { Search, Music, RefreshCw, Disc3, User, Folder } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Tab = "songs" | "albums" | "artists" | "folders";

const LibraryPage = () => {
  const { songs, playQueue } = useAudio();
  const [activeTab, setActiveTab] = useState<Tab>("songs");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh library function
  const refreshLibrary = async () => {
    setIsRefreshing(true);
    try {
      const libraryService = AudioLibraryService.getInstance();
      await libraryService.refresh();
      console.log('Library refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh library:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get albums, artists, folders from songs
  const albums = songs.reduce((acc, song) => {
    const albumKey = `${song.album} - ${song.artist}`;
    if (!acc[albumKey]) {
      acc[albumKey] = { name: song.album, artist: song.artist, songs: [], artwork: song.artwork };
    }
    acc[albumKey].songs.push(song);
    return acc;
  }, {} as Record<string, { name: string; artist: string; songs: Song[]; artwork: string }>);

  const artists = songs.reduce((acc, song) => {
    if (!acc[song.artist]) {
      acc[song.artist] = { name: song.artist, songs: [], albums: [...new Set(songs.map(s => s.album))] };
    }
    acc[song.artist].songs.push(song);
    return acc;
  }, {} as Record<string, { name: string; songs: Song[]; albums: string[] }>);

  const folders = [...new Set(songs.map((s) => s.folder))];

  const filteredSongs = songs.filter(
    (s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "songs", label: "Songs", icon: Music },
    { key: "albums", label: "Albums", icon: Disc3 },
    { key: "artists", label: "Artists", icon: User },
    { key: "folders", label: "Folders", icon: Folder },
  ];

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground mb-6">Library</h1>
      </motion.div>

      <div className="flex gap-2 mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-none"
        />
        <Button 
          onClick={refreshLibrary}
          disabled={isRefreshing}
          variant="outline" 
          size="sm"
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "songs" && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">{filteredSongs.length} songs</p>
          {filteredSongs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} />
          ))}
        </div>
      )}

      {activeTab === "albums" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album, i) => (
            <motion.div
              key={album.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => playQueue(album.songs)}
              className="cursor-pointer group"
            >
              <img src={album.artwork} alt={album.name} className="w-full aspect-square rounded-xl object-cover shadow-lg mb-3" />
              <p className="text-sm font-medium text-foreground line-clamp-1">{album.name}</p>
              <p className="text-xs text-muted-foreground">{album.artist} · {album.songs.length} songs</p>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "artists" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artists.map((artist, i) => (
            <motion.div
              key={artist.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center"
            >
              <img src={artist.artwork} alt={artist.name} className="w-28 h-28 rounded-full object-cover shadow-lg mb-3" />
              <p className="text-sm font-medium text-foreground">{artist.name}</p>
              <p className="text-xs text-muted-foreground">{artist.songCount} songs</p>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "folders" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {folders.map((folder, i) => {
            const folderSongs = songs.filter((s) => s.folder === folder);
            return (
              <motion.div
                key={folder}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => playQueue(folderSongs)}
                className="bg-secondary rounded-xl p-4 cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <Folder className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{folder}</p>
                <p className="text-xs text-muted-foreground">{folderSongs.length} songs</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
