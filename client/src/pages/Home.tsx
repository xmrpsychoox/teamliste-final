import { useAuth } from "@/_core/hooks/useAuth";
import { TeamList } from "@/components/TeamList";
import { TeamStats } from "@/components/TeamStats";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Settings, LogOut, LogIn, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated (before redirect happens)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6 p-8 bg-black/60 border border-red-900/30 rounded-lg backdrop-blur-sm">
          <Lock className="h-16 w-16 text-red-600 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400">You must be logged in to view the team list.</p>
          </div>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <LogIn className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-[-1]">
        <img 
          src="/images/syndikat-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-20 flex justify-between items-center px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-red-900/20">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
          <span className="text-white font-bold tracking-wider hidden sm:inline">SYNDIKAT</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:inline">
            Willkommen, <span className="text-red-400">{user?.name || 'User'}</span>
          </span>
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="bg-black/40 border-red-900/30 text-gray-300 hover:bg-red-950/30 hover:text-red-400">
                <Settings className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              logout();
              setLocation("/login");
            }}
            className="text-gray-400 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <header className="relative z-10 pt-12 pb-8 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-red-600 blur-[50px] opacity-20 rounded-full" />
          <img 
            src="/images/logo.png" 
            alt="Syndikat Logo" 
            className="h-32 md:h-48 mx-auto relative z-10 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-[0.2em] text-white syndikat-text-glow">
            Team <span className="text-red-600">Liste</span>
          </h1>
          <p className="text-gray-400 mt-2 font-mono tracking-widest text-sm md:text-base">
            HIERARCHY // STRUCTURE // ORDER
          </p>
        </motion.div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10 flex-1">
        <TeamStats />
        <TeamList />
      </main>

      <footer className="relative z-10 py-8 text-center text-gray-600 text-sm font-mono border-t border-red-900/20 mt-12 bg-black/40 backdrop-blur-sm">
        <p>&copy; 2025 SYNDIKAT. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 text-xs text-red-900/60">SYSTEM STATUS: ONLINE</p>
      </footer>
    </div>
  );
}
