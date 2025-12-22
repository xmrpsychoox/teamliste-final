import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";

export function TeamStats() {
  const { data: members, isLoading } = trpc.team.list.useQuery();

  if (isLoading) {
    return (
      <Card className="syndikat-card border-l-4 border-l-red-600 mb-8 bg-black/60">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return null;
  }

  return (
    <Card className="syndikat-card border-l-4 border-l-red-600 mb-8 bg-black/60 backdrop-blur-sm">
      <CardContent className="py-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 rounded-lg border border-red-600/30">
              <Users className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-wider">Gesamte Teammitglieder</p>
              <p className="text-4xl font-bold text-white syndikat-text-glow">{members.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
