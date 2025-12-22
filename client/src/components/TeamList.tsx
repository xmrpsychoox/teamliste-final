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

// Dynamic rank colors based on hierarchy position
const getRankColor = (sortOrder: number): string => {
  const colors = [
    "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]",  // 0-1: Top ranks
    "text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]",  // 2-3
    "text-orange-500",                                           // 4-5
    "text-red-400",                                              // 6-8
    "text-blue-500",                                             // 9-11
    "text-green-500",                                            // 12-14
    "text-purple-500",                                           // 15-17
    "text-cyan-400",                                             // 18-20
    "text-pink-500",                                             // 21+
    "text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]" // Special
  ];
  
  const index = Math.min(Math.floor(sortOrder / 3), colors.length - 1);
  return colors[index];
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
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: members, isLoading, error } = trpc.team.list.useQuery();
  const { data: roles = [] } = trpc.roles.getAll.useQuery();
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
                          memberRanks.some(r => selectedRanks.includes(r as string)) ||
                          (selectedRanks.includes("UNBEKANNTER RANG") && memberRanks.length === 0); // NEU: Filter für unbekannte Ränge
      return matchesSearch && matchesRank;
    });
  }, [members, searchQuery, selectedRanks]);

  // Group filtered members by their highest rank (using dynamic roles from DB)
  const groupedMembers = useMemo(() => {
    if (!roles.length) {
      // NEU: Fallback-Gruppierung, wenn keine Rollen vorhanden sind
      const unknownRankMembers = filteredMembers.filter(m => (m.ranks || []).length === 0);
      return unknownRankMembers.length > 0 ? { "UNBEKANNTER RANG": unknownRankMembers } : {};
    }
    
    // Create a map of rank name to sortOrder
    const rankOrderMap = new Map(roles.map(r => [r.name, r.sortOrder]));
    
    // Initialisiere die Gruppen mit den bekannten Rängen
    const groups: Record<string, typeof filteredMembers> = roles.reduce((acc, role) => {
      acc[role.name] = [];
      return acc;
    }, {} as Record<string, typeof filteredMembers>);

    // Füge eine Gruppe für unbekannte Ränge hinzu
    groups["UNBEKANNTER RANG"] = [];

    // Verteile die Mitglieder auf die Gruppen
    filteredMembers.forEach((member) => {
      const memberRanks = member.ranks || [];
      
      if (memberRanks.length === 0) {
        // Mitglied hat keinen Rang, füge es zur Gruppe "UNBEKANNTER RANG" hinzu
        groups["UNBEKANNTER RANG"].push(member);
        return;
      }

      // Finde den höchsten Rang (niedrigste sortOrder) für dieses Mitglied
      const highestRankOrder = Math.min(
        ...memberRanks.map(r => rankOrderMap.get(r as string) ?? 999)
      );

      // Finde den entsprechenden Rollennamen
      const highestRank = roles.find(r => r.sortOrder === highestRankOrder);

      if (highestRank) {
        // Füge das Mitglied zur Gruppe des höchsten Rangs hinzu
        groups[highestRank.name].push(member);
      } else {
        // Fallback, falls der Rangname nicht in der Rollenliste gefunden wird (sollte nicht passieren, aber zur Sicherheit)
        groups["UNBEKANNTER RANG"].push(member);
      }
    });

    // Entferne leere Gruppen und gib das Ergebnis zurück
    return Object.entries(groups).reduce((acc, [key, value]) => {
      if (value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, typeof filteredMembers>);

  }, [filteredMembers, roles]);

  const toggleRank = (rank: string) => {
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
            {/* NEU: Option für unbekannte Ränge */}
            <DropdownMenuCheckboxItem
              key="UNBEKANNTER RANG"
              checked={selectedRanks.includes("UNBEKANNTER RANG")}
              onCheckedChange={() => toggleRank("UNBEKANNTER RANG")}
              className="focus:bg-red-900/30 focus:text-white hover:bg-red-900/30 cursor-pointer font-bold"
            >
              UNBEKANNTER RANG
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="bg-red-900/50" />
            {roles.map((role) => (
              <DropdownMenuCheckboxItem
                key={role.id}
                checked={selectedRanks.includes(role.name)}
                onCheckedChange={() => toggleRank(role.name)}
                className="focus:bg-red-900/30 focus:text-white hover:bg-red-900/30 cursor-pointer"
              >
                {role.displayName}
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
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {Object.entries(groupedMembers).map(([rankName, members]) => {
              const role = roles.find(r => r.name === rankName);
              const sortOrder = role?.sortOrder ?? 999; // 999 for "UNBEKANNTER RANG"
              const rankColor = getRankColor(sortOrder);
              const displayName = role?.displayName ?? "UNBEKANNTER RANG";

              return (
                <Card key={rankName} className="bg-black/40 border-red-900/30 shadow-2xl shadow-red-900/10">
                  <CardHeader className="border-b border-red-900/30 p-4">
                    <CardTitle className={`text-xl font-bold ${rankColor} flex items-center`}>
                      <Briefcase className="h-5 w-5 mr-2" />
                      {displayName} ({members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {members.map((member) => {
                      const statusConfig = activityStatusConfig[member.activityStatus as ActivityStatus] || activityStatusConfig.abgemeldet;
                      const memberHighestRank = member.ranks && member.ranks.length > 0 
                        ? member.ranks.reduce((highest, current) => {
                            const currentOrder = rankOrderMap.get(current as string) ?? 999;
                            const highestOrder = rankOrderMap.get(highest as string) ?? 999;
                            return currentOrder < highestOrder ? current : highest;
                          }, member.ranks[0] as string)
                        : "UNBEKANNTER RANG";
                      const memberRole = roles.find(r => r.name === memberHighestRank);
                      const memberSortOrder = memberRole?.sortOrder ?? 999;
                      const memberRankColor = getRankColor(memberSortOrder);
                      const memberRankDisplayName = memberRole?.displayName ?? "UNBEKANNTER RANG";

                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col p-3 bg-black/50 border border-red-900/30 rounded-lg hover:border-red-500/50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-red-500/50">
                              <AvatarImage src={member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`} alt={member.name} />
                              <AvatarFallback className="bg-red-900/50 text-white">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                              <p className={`text-xs ${memberRankColor} truncate`}>{memberRankDisplayName}</p>
                            </div>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-400">
                                    {statusConfig.icon}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-black/90 border-red-900/50 text-gray-300 backdrop-blur-xl">
                                  <DropdownMenuLabel>Aktivitätsstatus</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-red-900/50" />
                                  {Object.entries(activityStatusConfig).map(([key, config]) => (
                                    <DropdownMenuItem 
                                      key={key} 
                                      onClick={() => handleActivityStatusChange(member.id, key as ActivityStatus)}
                                      className="focus:bg-red-900/30 focus:text-white hover:bg-red-900/30 cursor-pointer"
                                    >
                                      <span className={`mr-2 ${config.color}`}>{config.icon}</span>
                                      {config.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {(member.ranks || []).map((rank, index) => {
                                const role = roles.find(r => r.name === rank);
                                const sortOrder = role?.sortOrder ?? 999;
                                const color = getRankColor(sortOrder);
                                return (
                                  <Badge key={index} variant="outline" className={`text-xs ${color} border-current bg-transparent`}>
                                    {role?.displayName || rank}
                                  </Badge>
                                );
                              })}
                              {/* NEU: Badge für unbekannte Ränge */}
                              {(member.ranks || []).length === 0 && (
                                <Badge variant="outline" className="text-xs text-gray-500 border-gray-500 bg-transparent">
                                  UNBEKANNTER RANG
                                </Badge>
                              )}
                            </div>
                            
                            {isAdmin && (
                              <div className="mt-2 pt-2 border-t border-red-900/30">
                                <div className="flex justify-between items-start">
                                  <p className="text-xs text-gray-400 font-mono">NOTIZEN:</p>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-gray-400 hover:text-red-400"
                                    onClick={() => openNotesEditor(member.id, member.notes)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap min-h-[20px]">{member.notes || "Keine Notizen"}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
