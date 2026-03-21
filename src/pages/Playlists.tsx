import { useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { demoPlaylists, Playlist } from "@/data/demoData";
import SongRow from "@/components/SongRow";
import { Plus, Play, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PlaylistsPage = () => {
  const { songs, playQueue } = useAudio();
  const [playlists] = useState<Playlist[]>(demoPlaylists);
  const [selected, setSelected] = useState<Playlist | null>(null);

  const getPlaylistSongs = (playlist: Playlist) =>
    playlist.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as typeof songs;

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
