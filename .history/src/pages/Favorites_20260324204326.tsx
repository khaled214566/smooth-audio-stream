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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Heart className="h-7 w-7 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
          <p className="text-muted-foreground">{favorites.length} liked songs</p>
        </div>
      </motion.div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">No favorites yet</p>
          <p className="text-sm text-muted-foreground/70">Songs you like will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {favorites.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
