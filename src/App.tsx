import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioProvider } from "@/context/AudioContext";
import AppSidebar from "@/components/AppSidebar";
import BottomNav from "@/components/BottomNav";
import PlayerBar from "@/components/PlayerBar";
import HomePage from "@/pages/Home";
import LibraryPage from "@/pages/Library";
import PlaylistsPage from "@/pages/Playlists";
import FavoritesPage from "@/pages/Favorites";
import ConverterPage from "@/pages/Converter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => (
  <div className="flex w-full min-h-screen">
    <AppSidebar />
    <main className="flex-1 overflow-y-auto h-screen pb-[130px] md:pb-[73px]">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/converter" element={<ConverterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <BottomNav />
    <PlayerBar />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AudioProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AudioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
