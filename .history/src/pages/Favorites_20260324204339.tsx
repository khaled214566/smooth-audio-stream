import { useState, useEffect } from "react";
import { Heart, Play, MoreHorizontal, X, Music } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/context/AudioContext";
import StorageService from "@/lib/storageService";
import { toast } from "sonner";

const FavoritesPage = () => {
  const { songs, playQueue, toggleFavorite } = useAudio();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load favorites on mount
  useEffect(() => {
    setFavoriteIds(StorageService.getFavorites());
  }, []);

  const favoriteSongs = songs.filter(song => favoriteIds.includes(song.id));

  const playFavoriteSongs = () => {
    if (favoriteSongs.length > 0) {
      playQueue(favoriteSongs);
      toast.success(`Playing ${favoriteSongs.length} favorite song(s)`);
    } else {
      toast.error("No favorite songs to play");
    }
  };

  const handleToggleFavorite = (songId: string) => {
    toggleFavorite(songId);
    setFavoriteIds(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const selectAllFavorites = () => {
    setFavoriteIds(songs.map(song => song.id));
    songs.forEach(song => {
      if (!favoriteIds.includes(song.id)) {
        StorageService.addFavorite(song.id);
      }
    });
    toast.success("All songs marked as favorites");
  };

  const clearAllFavorites = () => {
    if (!confirm("Are you sure you want to remove all favorites?")) return;
    
    setFavoriteIds([]);
    songs.forEach(song => {
      StorageService.removeFavorite(song.id);
    });
    toast.success("All favorites cleared");
  };

  return (
    <div className="p-4 md:p-8 pb-40 scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Heart className="h-7 w-7 text-primary fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
            <p className="text-muted-foreground">Your most loved songs</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border rounded-xl p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {favoriteSongs.length} favorite song(s)
            </span>
            <Button variant="ghost" size="sm" onClick={selectAllFavorites}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAllFavorites}>
              Clear All
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={playFavoriteSongs}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Play All
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favoriteSongs.map((song, index) => (
          <motion.div
            key={song.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-colors group cursor-pointer"
            onClick={() => playQueue([song])}
          >
            <div className="relative mb-3">
              <img 
                src={song.artwork} 
                alt={song.title} 
                className="w-full aspect-square rounded-xl object-cover shadow-lg" 
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(song.id);
                  }}
                  className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Heart className={`h-4 w-4 ${favoriteIds.includes(song.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{song.title}</h3>
              <p className="text-sm text-muted-foreground">{song.artist}</p>
              <p className="text-sm text-muted-foreground">{song.album}</p>
              <p className="text-xs text-muted-foreground">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(song.id);
                }}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  playQueue([song]);
                }}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {favoriteSongs.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
          <p className="text-muted-foreground mb-6">
            Mark songs as favorites to quickly access your most loved music
          </p>
          <Button 
            onClick={selectAllFavorites}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Heart className="h-4 w-4 mr-2" />
            Mark All as Favorites
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default FavoritesPage;
