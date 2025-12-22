import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2, Users, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

const ranks = [
  "Projektleitung",
  "Stv.Projektleitung",
  "Leadership",
  "Head-Admin",
  "Admin",
  "T-Admin",
  "Head-Moderation",
  "Moderation",
  "T-Moderation",
  "Head-Support",
  "Support",
  "T-Support",
  "Head-Analyst",
  "Analyst",
  "Developer",
  "Development Cars",
  "Development Mapping",
  "Development Kleidung",
  "Medien Gestalter",
  "Highteam"
] as const;

const verwaltungen = [
  "Frakverwaltungs Leitung",
  "Frakverwaltung",
  "Eventmanagement",
  "Teamverwaltungs Leitung",
  "Teamverwaltung",
  "Regelwerkteam",
  "Teamüberwachung",
  "Support Leitung",
  "Mod Leitung",
  "Spendenverwaltung",
  "Streamingverwaltung"
] as const;

type Rank = typeof ranks[number];
type Verwaltung = typeof verwaltungen[number];

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setRedirecting(true);
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  // Show nothing while redirecting
  if (redirecting) {
    return null;
  }

  // Form state
  const [formName, setFormName] = useState("");
  const [formRanks, setFormRanks] = useState<Rank[]>([]);
  const [formVerwaltungen, setFormVerwaltungen] = useState<Verwaltung[]>([]);
  const [formDiscordId, setFormDiscordId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.team.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });

  const createMutation = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Teammitglied erfolgreich erstellt");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setEditingMember(null);
      resetForm();
      toast.success("Teammitglied erfolgreich aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Teammitglied erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormRanks([]);
    setFormVerwaltungen([]);
    setFormDiscordId("");
    setFormNotes("");
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    if (formRanks.length === 0) {
      toast.error("Mindestens ein Rang ist erforderlich");
      return;
    }
    createMutation.mutate({
      name: formName,
      ranks: formRanks,
      verwaltungen: formVerwaltungen.length > 0 ? formVerwaltungen : undefined,
      discordId: formDiscordId || undefined,
      notes: formNotes || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingMember || !formName.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    if (formRanks.length === 0) {
      toast.error("Mindestens ein Rang ist erforderlich");
      return;
    }
    updateMutation.mutate({
      id: editingMember,
      name: formName,
      ranks: formRanks,
      verwaltungen: formVerwaltungen.length > 0 ? formVerwaltungen : null,
      discordId: formDiscordId || null,
      notes: formNotes || null,
    });
  };

  const openEditDialog = (member: NonNullable<typeof members>[number]) => {
    setFormName(member.name);
    setFormRanks((member.ranks || []) as Rank[]);
    setFormVerwaltungen((member.verwaltungen || []) as Verwaltung[]);
    setFormDiscordId(member.discordId || "");
    setFormNotes(member.notes || "");
    setEditingMember(member.id);
  };

  const toggleRank = (rank: Rank) => {
    setFormRanks(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  const toggleVerwaltung = (verwaltung: Verwaltung) => {
    setFormVerwaltungen(prev => 
      prev.includes(verwaltung) ? prev.filter(v => v !== verwaltung) : [...prev, verwaltung]
    );
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Shield className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="text-gray-400">Bitte melden Sie sich an, um fortzufahren.</p>
        <Link href="/login">
          <Button className="bg-red-600 hover:bg-red-700">Anmelden</Button>
        </Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Shield className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Admin-Zugriff erforderlich</h1>
        <p className="text-gray-400">Sie haben keine Berechtigung, diese Seite zu sehen.</p>
        <Link href="/">
          <Button variant="outline" className="border-red-900/30 text-gray-300 hover:bg-red-950/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </Link>
      </div>
    );
  }

  const RankSelector = () => (
    <div className="space-y-2">
      <Label>Ränge *</Label>
      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-black/20 rounded-lg border border-red-900/20">
        {ranks.map((rank) => (
          <div key={rank} className="flex items-center space-x-2">
            <Checkbox
              id={`rank-${rank}`}
              checked={formRanks.includes(rank)}
              onCheckedChange={() => toggleRank(rank)}
              className="border-red-900/50 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <label
              htmlFor={`rank-${rank}`}
              className="text-sm text-gray-300 cursor-pointer hover:text-white"
            >
              {rank}
            </label>
          </div>
        ))}
      </div>
      {formRanks.length > 0 && (
        <p className="text-xs text-gray-500">
          Ausgewählt: {formRanks.join(", ")}
        </p>
      )}
    </div>
  );

  const VerwaltungSelector = () => (
    <div className="space-y-2">
      <Label>Verwaltungen (optional)</Label>
      <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 bg-black/20 rounded-lg border border-orange-900/20">
        {verwaltungen.map((verwaltung) => (
          <div key={verwaltung} className="flex items-center space-x-2">
            <Checkbox
              id={`verwaltung-${verwaltung}`}
              checked={formVerwaltungen.includes(verwaltung)}
              onCheckedChange={() => toggleVerwaltung(verwaltung)}
              className="border-orange-900/50 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
            />
            <label
              htmlFor={`verwaltung-${verwaltung}`}
              className="text-sm text-gray-300 cursor-pointer hover:text-white"
            >
              {verwaltung}
            </label>
          </div>
        ))}
      </div>
      {formVerwaltungen.length > 0 && (
        <p className="text-xs text-orange-400">
          Ausgewählt: {formVerwaltungen.join(", ")}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <img 
          src="/images/syndikat-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95" />
      </div>

      {/* Header */}
      <header className="border-b border-red-900/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-red-500" />
              <h1 className="text-xl font-bold tracking-wider">TEAM VERWALTUNG</h1>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Neues Mitglied
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neues Teammitglied erstellen</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fügen Sie ein neues Mitglied zum Team hinzu.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Discord Username"
                    className="bg-black/40 border-red-900/30"
                  />
                </div>
                <RankSelector />
                <VerwaltungSelector />
                <div className="space-y-2">
                  <Label htmlFor="discordId">Discord ID</Label>
                  <Input
                    id="discordId"
                    value={formDiscordId}
                    onChange={(e) => setFormDiscordId(e.target.value)}
                    placeholder="123456789012345678"
                    className="bg-black/40 border-red-900/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen..."
                    className="bg-black/40 border-red-900/30 min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-gray-700">
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleCreate} 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : !members || members.length === 0 ? (
          <Card className="bg-black/40 border-red-900/30 text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Noch keine Teammitglieder vorhanden.</p>
              <p className="text-gray-500 text-sm mt-2">Klicken Sie auf "Neues Mitglied", um zu beginnen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-black/40 border-red-900/30 hover:border-red-500/30 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-red-950 flex items-center justify-center text-red-200 font-bold">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white">{member.name}</h3>
                        <p className="text-sm text-red-400 truncate">
                          {(member.ranks || []).join(", ") || "Kein Rang"}
                        </p>
                        {member.verwaltungen && (member.verwaltungen as string[]).length > 0 && (
                          <p className="text-xs text-orange-400 truncate">
                            {(member.verwaltungen as string[]).join(", ")}
                          </p>
                        )}
                        {member.discordId && (
                          <p className="text-xs text-gray-500 font-mono">ID: {member.discordId}</p>
                        )}
                      </div>
                      {member.notes && (
                        <div className="hidden md:block max-w-xs">
                          <p className="text-xs text-gray-500 truncate" title={member.notes}>
                            📝 {member.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={editingMember === member.id} onOpenChange={(open) => !open && setEditingMember(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-gray-700 hover:border-red-500/50"
                            onClick={() => openEditDialog(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Teammitglied bearbeiten</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Ändern Sie die Details des Teammitglieds.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name *</Label>
                              <Input
                                id="edit-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="bg-black/40 border-red-900/30"
                              />
                            </div>
                            <RankSelector />
                            <VerwaltungSelector />
                            <div className="space-y-2">
                              <Label htmlFor="edit-discordId">Discord ID</Label>
                              <Input
                                id="edit-discordId"
                                value={formDiscordId}
                                onChange={(e) => setFormDiscordId(e.target.value)}
                                className="bg-black/40 border-red-900/30"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-notes">Notizen</Label>
                              <Textarea
                                id="edit-notes"
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                className="bg-black/40 border-red-900/30 min-h-[80px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMember(null)} className="border-gray-700">
                              Abbrechen
                            </Button>
                            <Button 
                              onClick={handleUpdate} 
                              className="bg-red-600 hover:bg-red-700"
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Speichern
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-gray-700 hover:border-red-500 hover:bg-red-950/30">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-red-900/30 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Teammitglied löschen?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Sind Sie sicher, dass Sie "{member.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-700">Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate({ id: member.id })}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
