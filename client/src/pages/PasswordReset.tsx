import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KeyRound, Lock, User, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PasswordReset() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Passwort erfolgreich geändert!", {
        description: "Sie können sich jetzt mit dem neuen Passwort anmelden.",
      });
      // Reset form
      setUsername("");
      setNewPassword("");
      setConfirmPassword("");
      setMasterPassword("");
    },
    onError: (error) => {
      toast.error("Fehler beim Zurücksetzen des Passworts", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!username || !newPassword || !confirmPassword || !masterPassword) {
      toast.error("Alle Felder sind erforderlich");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    resetPasswordMutation.mutate({
      username,
      newPassword,
      masterPassword,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <img 
          src="/images/syndikat-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-red-950/20" />
      </div>

      {/* Back to Login Link */}
      <Link href="/login">
        <Button 
          variant="ghost" 
          className="absolute top-6 left-6 text-gray-400 hover:text-red-400"
        >
          ← Zurück zum Login
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <Card className="syndikat-card border-red-900/30 bg-black/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center border border-red-600/30">
              <KeyRound className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold uppercase tracking-wider text-white syndikat-text-glow">
                Passwort Zurücksetzen
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2 font-mono text-xs">
                MASTER KENNWORT ERFORDERLICH
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 font-mono text-xs uppercase tracking-wider">
                  Benutzername
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="tvsyndikat"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600"
                    disabled={resetPasswordMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300 font-mono text-xs uppercase tracking-wider">
                  Neues Passwort
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600"
                    disabled={resetPasswordMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-mono text-xs uppercase tracking-wider">
                  Passwort Bestätigen
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600"
                    disabled={resetPasswordMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterPassword" className="text-gray-300 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  Master Kennwort
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  <Input
                    id="masterPassword"
                    type="password"
                    placeholder="Master Kennwort eingeben"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-600"
                    disabled={resetPasswordMutation.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500 font-mono">
                  Nur autorisierte Personen haben Zugriff auf das Master Kennwort
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Wird geändert..." : "Passwort Ändern"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs font-mono mt-6">
          SYNDIKAT SECURITY PROTOCOL v1.0
        </p>
      </motion.div>
    </div>
  );
}
