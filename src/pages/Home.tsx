import { useAudio } from "@/context/AudioContext";
import SongRow from "@/components/SongRow";
import { Play, TrendingUp, Clock, Disc3 } from "lucide-react";
import { motion } from "framer-motion";
import { getAlbums } from "@/data/demoData";

const HomePage = () => {
  const { songs, playQueue, trackTags } = useAudio();

  const recentlyAdded = [...songs].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).slice(0, 5);
  const mostPlayed = [...songs].sort((a, b) => b.playCount - a.playCount).slice(0, 5);
  const albums = getAlbums();

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">Good evening</h1>
        <p className="text-muted-foreground mb-8">Pick up where you left off</p>
      </motion.div>

      {/* Quick play cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {songs.slice(0, 6).map((song, i) => {
          const meta = trackTags[song.id];
          const label = meta?.title ?? song.title;
          const art = meta?.artworkObjectUrl ?? song.artwork;
          return (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => playQueue(songs, songs.indexOf(song))}
            className="flex items-center gap-3 bg-secondary/50 hover:bg-secondary rounded-lg overflow-hidden cursor-pointer group transition-colors"
          >
            <img src={art} alt={label} className="w-12 h-12 md:w-14 md:h-14 object-cover" />
            <span className="text-sm font-medium text-foreground line-clamp-1 flex-1">{label}</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
            </div>
          </motion.div>
        );
        })}
      </div>

      {/* Album row */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Disc3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Albums</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {albums.map((album, i) => (
            <motion.div
              key={album.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => playQueue(album.songs)}
              className="flex-shrink-0 w-40 cursor-pointer group"
            >
              <div className="relative mb-3">
                <img src={album.artwork} alt={album.name} className="w-40 h-40 rounded-xl object-cover shadow-lg" />
                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-xl">
                  <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-1">{album.name}</p>
              <p className="text-xs text-muted-foreground">{album.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recently added */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Recently Added</h2>
        </div>
        <div className="space-y-1">
          {recentlyAdded.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} />
          ))}
        </div>
      </section>

      {/* Most played */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Most Played</h2>
        </div>
        <div className="space-y-1">
          {mostPlayed.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
