import { NavLink } from "@/components/NavLink";
import { Home, Library, ListMusic, Heart, Download } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/converter", icon: Download, label: "Convert" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-[73px] left-0 right-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
