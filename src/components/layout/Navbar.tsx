import { Link } from 'react-router-dom';
import { Music2, Menu, Settings } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { authService } from '../../lib/auth';
import { useState } from 'react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await authService.signOut();
    logout();
    setMenuOpen(false);
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-xl border-b border-white/10 z-40">
      <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Profile Picture or Logo */}
        <Link to="/profile" className="flex-shrink-0">
          {isAuthenticated && user ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
          )}
        </Link>
        
        {/* Center: Logo */}
        <Link to="/" className="flex items-center justify-center">
          <Music2 className="w-7 h-7" />
        </Link>
        
        {/* Right: Settings/Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 w-56 glass-card rounded-xl border border-white/10 overflow-hidden z-50">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/upload"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      Upload Music
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-red-400"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
}
