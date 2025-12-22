import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, User, LogIn } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login erfolgreich!");
      window.location.href = "/"; // Full reload to update auth state
    },
    onError: (error) => {
      toast.error(error.message || "Login fehlgeschlagen");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-[-1]">
        <img 
          src="/images/syndikat-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-red-950/30" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <Card className="bg-black/60 backdrop-blur-md border-red-900/30 shadow-2xl shadow-red-900/20 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.img 
              src="/images/logo.png" 
              alt="SYNDIKAT Logo" 
              className="h-24 mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6 }}
            />
            <h1 className="text-3xl font-bold uppercase tracking-[0.3em] text-white">
              <span className="text-red-600">SYSTEM</span> ACCESS
            </h1>
            <p className="text-gray-500 text-sm font-mono mt-2 tracking-widest">
              AUTHORIZED PERSONNEL ONLY
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300 font-mono text-xs tracking-wider">
                USERNAME
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20"
                  placeholder="Enter username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-mono text-xs tracking-wider">
                PASSWORD
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest border border-red-500/50 shadow-lg shadow-red-900/50 transition-all duration-300 hover:shadow-red-900/70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  ACCESS SYSTEM
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-red-900/20 text-center space-y-3">
            <Link href="/password-reset">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400 text-xs font-mono">
                Passwort vergessen?
              </Button>
            </Link>
            <p className="text-xs text-gray-600 font-mono tracking-wider">
              SYNDIKAT SECURITY SYSTEM v2.0
            </p>
            <p className="text-xs text-red-900/60 font-mono mt-1">
              UNAUTHORIZED ACCESS WILL BE LOGGED
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
