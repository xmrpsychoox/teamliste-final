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
import { ArrowLeft, Plus, Pencil, Trash2, Users, Shield, Loader2, Settings, Search, ChevronUp, ChevronDown, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);

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
  const [formRanks, setFormRanks] = useState<string[]>([]);
  const [formVerwaltungen, setFormVerwaltungen] = useState<string[]>([]);
  const [formDiscordId, setFormDiscordId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Settings form state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newVerwaltungName, setNewVerwaltungName] = useState("");
  const [newVerwaltungDisplayName, setNewVerwaltungDisplayName] = useState("");

  const utils = trpc.useUtils();
  
  // Fetch members
  const { data: members, isLoading } = trpc.team.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });

  // Fetch roles and verwaltungen from database
  const { data: roles = [] } = trpc.roles.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });
  const { data: verwaltungen = [] } = trpc.verwaltungen.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });

  // Mutations for members
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

  // Mutations for roles
  const createRole = trpc.roles.create.useMutation({
    onSuccess: () => {
      utils.roles.getAll.invalidate();
      toast.success("Rolle erfolgreich erstellt");
      setNewRoleName("");
      setNewRoleDisplayName("");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteRole = trpc.roles.delete.useMutation({
    onSuccess: () => {
      utils.roles.getAll.invalidate();
      toast.success("Rolle erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateRole = trpc.roles.update.useMutation({
    onSuccess: () => {
      utils.roles.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Mutations for verwaltungen
  const createVerwaltung = trpc.verwaltungen.create.useMutation({
    onSuccess: () => {
      utils.verwaltungen.getAll.invalidate();
      toast.success("Verwaltung erfolgreich erstellt");
      setNewVerwaltungName("");
      setNewVerwaltungDisplayName("");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteVerwaltung = trpc.verwaltungen.delete.useMutation({
    onSuccess: () => {
      utils.verwaltungen.getAll.invalidate();
      toast.success("Verwaltung erfolgreich gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateVerwaltung = trpc.verwaltungen.update.useMutation({
    onSuccess: () => {
      utils.verwaltungen.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // NEW: Mutation for invalidating all sessions
  const invalidateAllSessions = trpc.auth.invalidateAllSessions.useMutation({
    onSuccess: () => {
      toast.success("Alle Benutzer wurden ausgeloggt");
      setIsLogoutAllOpen(false);
      setMasterPassword("");
      // Logout current user after invalidating all sessions
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
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
    setFormRanks((member.ranks || []) as string[]);
    setFormVerwaltungen((member.verwaltungen || []) as string[]);
    setFormDiscordId(member.discordId || "");
    setFormNotes(member.notes || "");
    setEditingMember(member.id);
  };

  const toggleRank = (rank: string) => {
    setFormRanks(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  const toggleVerwaltung = (verwaltung: string) => {
    setFormVerwaltungen(prev => 
      prev.includes(verwaltung) ? prev.filter(v => v !== verwaltung) : [...prev, verwaltung]
    );
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim() || !newRoleDisplayName.trim()) {
      toast.error("Name und Anzeigename sind erforderlich");
      return;
    }
    createRole.mutate({
      name: newRoleName,
      displayName: newRoleDisplayName,
      isListed: true,
      sortOrder: roles.length,
    });
  };

  const handleCreateVerwaltung = () => {
    if (!newVerwaltungName.trim() || !newVerwaltungDisplayName.trim()) {
      toast.error("Name und Anzeigename sind erforderlich");
      return;
    }
    createVerwaltung.mutate({
      name: newVerwaltungName,
      displayName: newVerwaltungDisplayName,
      isListed: true,
      sortOrder: verwaltungen.length,
    });
  };

  // NEW: Handle logout all users
  const handleLogoutAllUsers = () => {
    if (!masterPassword.trim()) {
      toast.error("Master-Passwort ist erforderlich");
      return;
    }
    invalidateAllSessions.mutate({
      masterPassword: masterPassword,
    });
  };

  const moveRole = (id: number, direction: 'up' | 'down') => {
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= roles.length) return;
    
    const targetRole = roles[newIndex];
    
    // Swap sortOrder
    updateRole.mutate({ id: id, sortOrder: targetRole.sortOrder });
    updateRole.mutate({ id: targetRole.id, sortOrder: roles[index].sortOrder });
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
          <Button className="bg-red-600 hover:bg-red-700">Zurück zur Startseite</Button>
        </Link>
      </div>
    );
  }

  const filteredMembers = members?.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const RankSelector = () => (
    <div className="space-y-2">
      <Label>Ränge *</Label>
      <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto bg-black/20 p-3 rounded-lg border border-red-900/30">
        {roles.map(role => (
          <label key={role.id} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formRanks.includes(role.name)}
              onCheckedChange={() => toggleRank(role.name)}
              className="border-red-900/50 data-[state=checked]:bg-red-600"
            />
            <span className="text-sm">{role.displayName}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const VerwaltungSelector = () => (
    <div className="space-y-2">
      <Label>Verwaltungen</Label>
      <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto bg-black/20 p-3 rounded-lg border border-orange-900/30">
        {verwaltungen.map(verwaltung => (
          <label key={verwaltung.id} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formVerwaltungen.includes(verwaltung.name)}
              onCheckedChange={() => toggleVerwaltung(verwaltung.name)}
              className="border-orange-900/50 data-[state=checked]:bg-orange-600"
            />
            <span className="text-sm">{verwaltung.displayName}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          {/* NEW: Logout All Users Button */}
          <AlertDialog open={isLogoutAllOpen} onOpenChange={setIsLogoutAllOpen}>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-700 hover:bg-red-800">
                <LogOut className="mr-2 h-4 w-4" />
                Alle ausloggen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-red-900/30 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Benutzer ausloggen?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Dies wird alle aktiven Benutzer-Sessions invalidieren. Alle Benutzer müssen sich neu anmelden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="masterPassword">Master-Passwort</Label>
                  <Input
                    id="masterPassword"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Geben Sie das Master-Passwort ein"
                    className="bg-black/20 border-red-900/30"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-700">Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogoutAllUsers}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={invalidateAllSessions.isPending || !masterPassword.trim()}
                >
                  {invalidateAllSessions.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Alle ausloggen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Team Members Section */}
          <Card className="bg-gray-900/50 border-red-900/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-red-500" />
                  <h2 className="text-2xl font-bold">Teammitglieder</h2>
                  {!isLoading && members && (
                    <span className="text-sm text-gray-400">({members.length})</span>
                  )}
                </div>
                <div className="flex gap-3">
                  {/* Settings Dialog */}
                  <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gray-700 hover:bg-gray-600">
                        <Settings className="mr-2 h-4 w-4" />
                        Ränge & Verwaltungen verwalten
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Ränge & Verwaltungen verwalten</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Erstellen, bearbeiten und löschen Sie Ränge und Verwaltungen
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-8 py-4">
                        {/* Roles Section */}
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-red-400">Rollen verwalten</h3>
                          
                          {/* Create Role Form */}
                          <div className="bg-black/40 p-4 rounded-lg mb-4 border border-red-900/20">
                            <h4 className="text-sm font-medium mb-3 text-gray-300">Neue Rolle erstellen</h4>
                            <div className="flex gap-3">
                              <Input
                                type="text"
                                placeholder="Name (z.B. admin)"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="flex-1 bg-black/20 border-red-900/30"
                              />
                              <Input
                                type="text"
                                placeholder="Anzeigename (z.B. Administrator)"
                                value={newRoleDisplayName}
                                onChange={(e) => setNewRoleDisplayName(e.target.value)}
                                className="flex-1 bg-black/20 border-red-900/30"
                              />
                              <Button
                                onClick={handleCreateRole}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={createRole.isPending}
                              >
                                {createRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Erstellen
                              </Button>
                            </div>
                          </div>

                          {/* Roles List */}
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {roles.map((role, index) => (
                              <div key={role.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-red-900/20">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    onClick={() => moveRole(role.id, 'up')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-950/30"
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                  </Button>
                                  <Button
                                    onClick={() => moveRole(role.id, 'down')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-950/30"
                                    disabled={index === roles.length - 1}
                                  >
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-white">{role.displayName}</div>
                                  <div className="text-sm text-gray-400">{role.name}</div>
                                </div>
                                <label className="flex items-center gap-2">
                                  <Checkbox
                                    checked={role.isListed}
                                    onCheckedChange={(checked) =>
                                      updateRole.mutate({ id: role.id, isListed: checked as boolean })
                                    }
                                    className="border-red-900/50 data-[state=checked]:bg-red-600"
                                  />
                                  <span className="text-sm text-gray-300">Gelistet</span>
                                </label>
                                <Button
                                  onClick={() => deleteRole.mutate({ id: role.id })}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-900/50 hover:bg-red-950/30 text-red-400"
                                  disabled={deleteRole.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Verwaltungen Section */}
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-orange-400">Verwaltungen verwalten</h3>
                          
                          {/* Create Verwaltung Form */}
                          <div className="bg-black/40 p-4 rounded-lg mb-4 border border-orange-900/20">
                            <h4 className="text-sm font-medium mb-3 text-gray-300">Neue Verwaltung erstellen</h4>
                            <div className="flex gap-3">
                              <Input
                                type="text"
                                placeholder="Name (z.B. eventmanagement)"
                                value={newVerwaltungName}
                                onChange={(e) => setNewVerwaltungName(e.target.value)}
                                className="flex-1 bg-black/20 border-orange-900/30"
                              />
                              <Input
                                type="text"
                                placeholder="Anzeigename (z.B. Eventmanagement)"
                                value={newVerwaltungDisplayName}
                                onChange={(e) => setNewVerwaltungDisplayName(e.target.value)}
                                className="flex-1 bg-black/20 border-orange-900/30"
                              />
                              <Button
                                onClick={handleCreateVerwaltung}
                                className="bg-orange-600 hover:bg-orange-700"
                                disabled={createVerwaltung.isPending}
                              >
                                {createVerwaltung.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Erstellen
                              </Button>
                            </div>
                          </div>

                          {/* Verwaltungen List */}
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {verwaltungen.map((verwaltung) => (
                              <div key={verwaltung.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-orange-900/20">
                                <div className="flex-1">
                                  <div className="font-medium text-white">{verwaltung.displayName}</div>
                                  <div className="text-sm text-gray-400">{verwaltung.name}</div>
                                </div>
                                <label className="flex items-center gap-2">
                                  <Checkbox
                                    checked={verwaltung.isListed}
                                    onCheckedChange={(checked) =>
                                      updateVerwaltung.mutate({ id: verwaltung.id, isListed: checked as boolean })
                                    }
                                    className="border-orange-900/50 data-[state=checked]:bg-orange-600"
                                  />
                                  <span className="text-sm text-gray-300">Gelistet</span>
                                </label>
                                <Button
                                  onClick={() => deleteVerwaltung.mutate({ id: verwaltung.id })}
                                  variant="outline"
                                  size="sm"
                                  className="border-orange-900/50 hover:bg-orange-950/30 text-orange-400"
                                  disabled={deleteVerwaltung.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="border-gray-700">
                          Schließen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Create Member Dialog */}
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Neues Mitglied
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Neues Teammitglied erstellen</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Fügen Sie ein neues Mitglied zum Team hinzu
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Max Mustermann"
                            className="bg-black/20 border-red-900/30"
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
                            className="bg-black/20 border-red-900/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notizen</Label>
                          <Textarea
                            id="notes"
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Zusätzliche Informationen..."
                            className="bg-black/20 border-red-900/30 min-h-[100px]"
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
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Nach Mitglied suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/20 border-red-900/30"
                  />
                </div>
              </div>

              {/* Members List */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Keine Mitglieder gefunden
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-red-900/20 hover:border-red-900/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          {member.discordId && (
                            <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded font-mono">
                              {member.discordId}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(member.ranks || []).map((rank) => (
                            <span key={rank} className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded">
                              {rank}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => openEditDialog(member)}
                              variant="outline"
                              size="sm"
                              className="border-red-900/50 hover:bg-red-950/30 text-red-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Teammitglied bearbeiten</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Bearbeiten Sie die Informationen des Mitglieds
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Name *</Label>
                                <Input
                                  id="edit-name"
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  placeholder="Max Mustermann"
                                  className="bg-black/20 border-red-900/30"
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
                                  placeholder="123456789012345678"
                                  className="bg-black/20 border-red-900/30"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notizen</Label>
                                <Textarea
                                  id="edit-notes"
                                  value={formNotes}
                                  onChange={(e) => setFormNotes(e.target.value)}
                                  placeholder="Zusätzliche Informationen..."
                                  className="bg-black/20 border-red-900/30 min-h-[100px]"
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-900/50 hover:bg-red-950/30 text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-red-900/30 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mitglied löschen?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Diese Aktion kann nicht rückgängig gemacht werden. Das Mitglied "{member.name}" wird permanent gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-700">Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: member.id })}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
