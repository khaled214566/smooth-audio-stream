import { NavLink } from "@/components/NavLink";
import { Home, Library, ListMusic, Heart, Download, Music2 } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/converter", icon: Download, label: "Converter" },
];

const AppSidebar = () => {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <Music2 className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-gradient">SoundFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">SoundFlow v1.0</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
