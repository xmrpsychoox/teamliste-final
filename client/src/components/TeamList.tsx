import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Loader2, MessageCircle, UserCheck, UserX, Clock, Pencil, Save, X, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const rankHierarchy = [
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

type Rank = typeof rankHierarchy[number];

const rankColors: Record<Rank, string> = {
  "Projektleitung": "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]",
  "Stv.Projektleitung": "text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]",
  "Leadership": "text-orange-500",
  "Head-Admin": "text-red-400",
  "Admin": "text-red-400",
  "T-Admin": "text-red-300",
  "Head-Moderation": "text-blue-500",
  "Moderation": "text-blue-400",
  "T-Moderation": "text-blue-300",
  "Head-Support": "text-green-500",
  "Support": "text-green-400",
  "T-Support": "text-green-300",
  "Head-Analyst": "text-purple-500",
  "Analyst": "text-purple-400",
  "Developer": "text-cyan-400",
  "Development Cars": "text-cyan-300",
  "Development Mapping": "text-cyan-300",
  "Development Kleidung": "text-cyan-300",
  "Medien Gestalter": "text-pink-500",
  "Highteam": "text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]"
};

type ActivityStatus = "aktiv" | "inaktiv" | "abgemeldet" | "gespraech_noetig";

const activityStatusConfig: Record<ActivityStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  "aktiv": { label: "Aktiv", color: "text-green-400", bgColor: "bg-green-500", icon: <UserCheck className="h-3 w-3" /> },
  "inaktiv": { label: "Inaktiv", color: "text-yellow-400", bgColor: "bg-yellow-500", icon: <Clock className="h-3 w-3" /> },
  "abgemeldet": { label: "Abgemeldet", color: "text-gray-400", bgColor: "bg-gray-500", icon: <UserX className="h-3 w-3" /> },
  "gespraech_noetig": { label: "Gespräch nötig", color: "text-red-400", bgColor: "bg-red-500", icon: <MessageCircle className="h-3 w-3" /> },
};

export function TeamList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRanks, setSelectedRanks] = useState<Rank[]>([]);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: members, isLoading, error } = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const updateActivityMutation = trpc.team.updateActivityStatus.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Status aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateNotesMutation = trpc.team.updateNotes.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setEditingNotesId(null);
      toast.success("Notiz gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Filter members based on search and selected ranks
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((member) => {
      const memberRanks = member.ranks || [];
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            member.id.toString().includes(searchQuery) ||
                            (member.discordId && member.discordId.includes(searchQuery));
      const matchesRank = selectedRanks.length === 0 || 
                          memberRanks.some(r => selectedRanks.includes(r as Rank));
      return matchesSearch && matchesRank;
    });
  }, [members, searchQuery, selectedRanks]);

  // Group filtered members by their highest rank
  const groupedMembers = useMemo(() => {
    return rankHierarchy.reduce((acc, rank) => {
      const rankMembers = filteredMembers.filter((m) => {
        const memberRanks = m.ranks || [];
        // Get highest rank for this member
        const highestRankIndex = Math.min(
          ...memberRanks.map(r => rankHierarchy.indexOf(r as Rank)).filter(i => i >= 0)
        );
        return rankHierarchy[highestRankIndex] === rank;
      });
      if (rankMembers.length > 0) {
        acc[rank] = rankMembers;
      }
      return acc;
    }, {} as Record<Rank, typeof filteredMembers>);
  }, [filteredMembers]);

  const toggleRank = (rank: Rank) => {
    setSelectedRanks(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  const handleActivityStatusChange = (memberId: number, status: ActivityStatus) => {
    updateActivityMutation.mutate({ id: memberId, activityStatus: status });
  };

  const openNotesEditor = (memberId: number, currentNotes: string | null) => {
    setEditingNotesId(memberId);
    setNotesValue(currentNotes || "");
  };

  const saveNotes = () => {
    if (editingNotesId === null) return;
    updateNotesMutation.mutate({ 
      id: editingNotesId, 
      notes: notesValue.trim() || null 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="ml-3 text-gray-400 font-mono">LOADING OPERATIVES...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 font-mono border border-dashed border-red-900/30 rounded-lg bg-black/20">
        ERROR: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notes Edit Dialog */}
      <Dialog open={editingNotesId !== null} onOpenChange={(open) => !open && setEditingNotesId(null)}>
        <DialogContent className="bg-gray-900 border-red-900/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Notiz bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Notizen zum Teammitglied eingeben..."
              className="bg-black/40 border-red-900/30 min-h-[150px] text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingNotesId(null)}
              className="border-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button 
              onClick={saveNotes}
              className="bg-red-600 hover:bg-red-700"
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500/50 h-4 w-4" />
          <Input 
            placeholder="SEARCH OPERATIVE..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 border-red-900/30 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 transition-all"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-black/40 border-red-900/30 text-gray-300 hover:bg-red-950/30 hover:text-red-400 hover:border-red-500/50">
              <Filter className="mr-2 h-4 w-4" />
              FILTER RANKS
              {selectedRanks.length > 0 && (
                <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {selectedRanks.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black/90 border-red-900/50 text-gray-300 max-h-[400px] overflow-y-auto backdrop-blur-xl">
            {rankHierarchy.map((rank) => (
              <DropdownMenuCheckboxItem
                key={rank}
                checked={selectedRanks.includes(rank)}
                onCheckedChange={() => toggleRank(rank)}
                className="focus:bg-red-900/30 focus:text-white hover:bg-red-900/30 cursor-pointer"
              >
                {rank}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {!members || members.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500 font-mono border border-dashed border-red-900/30 rounded-lg bg-black/20"
          >
            NO OPERATIVES IN DATABASE. ADD MEMBERS VIA ADMIN PANEL.
          </motion.div>
        ) : Object.keys(groupedMembers).length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500 font-mono border border-dashed border-red-900/30 rounded-lg bg-black/20"
          >
            NO OPERATIVES FOUND MATCHING CRITERIA
          </motion.div>
        ) : (
          rankHierarchy.map((rank) => {
            const rankMembers = groupedMembers[rank];
            if (!rankMembers) return null;

            return (
              <motion.div
                key={rank}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
                  <h2 className={`text-2xl font-bold uppercase tracking-widest ${rankColors[rank]} syndikat-text-glow`}>
                    {rank}
                  </h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rankMembers.map((member) => {
                    const memberRanks = member.ranks || [];
                    const memberVerwaltungen = (member.verwaltungen || []) as string[];
                    const activityStatus = (member.activityStatus || "aktiv") as ActivityStatus;
                    const statusConfig = activityStatusConfig[activityStatus];

                    return (
                      <Card key={member.id} className="syndikat-card border-l-4 border-l-red-600 overflow-hidden group relative">
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-red-900/50 group-hover:border-red-500 transition-colors">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback className="bg-red-950 text-red-200 font-bold">
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Activity Status Indicator */}
                            <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black ${statusConfig.bgColor} flex items-center justify-center`} 
                                  title={statusConfig.label}>
                            </span>
                          </div>
                          <div className="flex flex-col overflow-hidden flex-1">
                            <CardTitle className="text-lg font-bold truncate text-gray-100 group-hover:text-red-400 transition-colors">
                              {member.name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {memberRanks.slice(0, 2).map((r, i) => (
                                <span key={i} className={`text-[10px] uppercase tracking-wider font-semibold ${rankColors[r as Rank] || 'text-gray-400'}`}>
                                  {r}
                                </span>
                              ))}
                              {memberRanks.length > 2 && (
                                <span className="text-[10px] text-gray-500">+{memberRanks.length - 2}</span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Discord ID */}
                          {member.discordId && (
                            <div className="text-xs text-gray-500 font-mono">
                              Discord: <span className="text-gray-400">{member.discordId}</span>
                            </div>
                          )}

                          {/* Verwaltungen - displayed prominently */}
                          {memberVerwaltungen.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 text-xs text-orange-400/70 uppercase tracking-wider font-semibold">
                                <Briefcase className="h-3 w-3" />
                                <span>Verwaltungen</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {memberVerwaltungen.map((v, i) => (
                                  <Badge 
                                    key={i} 
                                    variant="outline" 
                                    className="text-[10px] bg-orange-950/30 border-orange-500/30 text-orange-300 hover:bg-orange-950/50"
                                  >
                                    {v}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Activity Status Selector (Admin only) */}
                          <div className="flex items-center justify-between">
                            {isAdmin ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-7 px-2 ${statusConfig.color} hover:bg-red-950/30`}
                                    disabled={updateActivityMutation.isPending}
                                  >
                                    {statusConfig.icon}
                                    <span className="ml-1 text-xs">{statusConfig.label}</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-black/90 border-red-900/50 backdrop-blur-xl">
                                  <DropdownMenuLabel className="text-gray-400 text-xs">Status ändern</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-red-900/30" />
                                  {(Object.entries(activityStatusConfig) as [ActivityStatus, typeof activityStatusConfig[ActivityStatus]][]).map(([status, config]) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => handleActivityStatusChange(member.id, status)}
                                      className={`${config.color} focus:bg-red-900/30 cursor-pointer`}
                                    >
                                      {config.icon}
                                      <span className="ml-2">{config.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <div className={`flex items-center gap-1 ${statusConfig.color} text-xs`}>
                                {statusConfig.icon}
                                <span>{statusConfig.label}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-600 font-mono">
                              ID: {member.id.toString().padStart(4, '0')}
                            </span>
                          </div>

                          {/* Notes Section - Clearly visible and editable */}
                          <div className="mt-3 pt-3 border-t border-red-900/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Notizen</span>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-gray-500 hover:text-red-400 hover:bg-red-950/30"
                                  onClick={() => openNotesEditor(member.id, member.notes)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {member.notes ? (
                              <div className="bg-black/30 rounded-md p-3 border border-red-900/20">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {member.notes}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-black/20 rounded-md p-3 border border-dashed border-red-900/20">
                                <p className="text-xs text-gray-600 italic">
                                  {isAdmin ? "Klicken Sie auf den Stift, um eine Notiz hinzuzufügen" : "Keine Notizen vorhanden"}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
