import { useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { demoPlaylists, Playlist } from "@/data/demoData";
import SongRow from "@/components/SongRow";
import { Plus, Play, ArrowLeft, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";


const PlaylistsPage = () => {
  const { songs, playQueue } = useAudio();

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("playlists");
    return saved ? JSON.parse(saved) : demoPlaylists;
  });
  const [selected, setSelected] = useState<Playlist | null>(null);

  const getPlaylistSongs = (playlist: Playlist) =>
    playlist.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean) as typeof songs;

  const getPlaylistCover = (playlist: Playlist) => {
    if (playlist.artwork) return playlist.artwork;

    const imgs = getPlaylistSongs(playlist)
      .slice(0, 4)
      .map((s) => s.artwork);

    return imgs;
  };

  const handleCoverUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    playlistId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId
            ? { ...p, artwork: base64 }
            : p
        )
      );

      if (selected && selected.id === playlistId) {
        setSelected({ ...selected, artwork: base64 });
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  const renderCover = (playlist: Playlist) => {
    const cover = getPlaylistCover(playlist);

    if (Array.isArray(cover) && cover.length > 0) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 w-full aspect-square rounded-xl overflow-hidden shadow-lg">
          {cover.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      );
    }

    return (
      <img
        src={cover as string}
        alt={playlist.name}
        className="w-full aspect-square rounded-xl object-cover shadow-lg"
      />
    );
  };

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Back */}
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" /> Back to Playlists
            </button>

            {/* Header */}
            <div className="flex items-end gap-6 mb-8">
              <div className="relative w-48 h-48">
                {renderCover(selected)}

                {/* Upload Cover */}
                <label className="absolute bottom-2 right-2 cursor-pointer bg-black/60 p-2 rounded-full">
                  <ImagePlus className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={(e) => handleCoverUpload(e, selected.id)}
                  />
                </label>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Playlist
                </p>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {selected.name}
                </h1>

                <p className="text-muted-foreground">
                  {selected.songIds.length} songs
                </p>

                <button
                  onClick={() => playQueue(getPlaylistSongs(selected))}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:scale-105 transition-transform"
                >
                  <Play className="h-5 w-5" /> Play All
                </button>
              </div>
            </div>

            {/* Songs */}
            <div className="space-y-1">
              {getPlaylistSongs(selected).map((song, i) => (
                <SongRow key={song.id} song={song} index={i} queue={getPlaylistSongs(selected)} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-foreground">
                Playlists
              </h1>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm font-medium">
                <Plus className="h-4 w-4" /> New Playlist
              </button>
            </div>

            {/* Grid */}
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
                    {renderCover(playlist)}

                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-xl">
                      <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {playlist.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {playlist.songIds.length} songs
                  </p>
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