import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, Technician } from "@shared/schema";

interface SubstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export default function SubstitutionModal({ open, onOpenChange, teamId }: SubstitutionModalProps) {
  const [oldTechnicianId, setOldTechnicianId] = useState("");
  const [newTechnicianId, setNewTechnicianId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const currentTeam = teams.find(team => team.id === teamId);
  const currentTeamTechnicians = currentTeam?.technicianIds
    .map(id => technicians.find(tech => tech.id === id))
    .filter(Boolean) || [];

  const availableTechnicians = technicians.filter(tech => 
    !currentTeam?.technicianIds.includes(tech.id)
  );

  const substitutionMutation = useMutation({
    mutationFn: async (data: { teamId: string; oldTechnicianId: string; newTechnicianId: string }) => {
      const response = await apiRequest("POST", "/api/teams/substitute", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setOldTechnicianId("");
      setNewTechnicianId("");
      onOpenChange(false);
      toast({ title: "Técnico substituído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao substituir técnico", variant: "destructive" });
    }
  });

  const handleSubstitution = () => {
    if (!oldTechnicianId || !newTechnicianId) return;

    substitutionMutation.mutate({
      teamId,
      oldTechnicianId,
      newTechnicianId
    });
  };

  if (!currentTeam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Substituir Técnico
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-substitution-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-lg font-medium text-white mb-4">
              Equipe: {currentTeam.name}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Técnico a ser substituído
                </label>
                <Select value={oldTechnicianId} onValueChange={setOldTechnicianId}>
                  <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white" data-testid="select-old-technician">
                    <SelectValue placeholder="Selecione o técnico a ser substituído" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTeamTechnicians.map((tech) => tech && (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Novo técnico
                </label>
                <Select value={newTechnicianId} onValueChange={setNewTechnicianId}>
                  <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white" data-testid="select-new-technician">
                    <SelectValue placeholder="Selecione o novo técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechnicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                        <div className="text-xs text-muted-foreground">
                          Cidades: {tech.cities.join(", ") || "Nenhuma"}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableTechnicians.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhum técnico disponível para substituição
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            className="flex-1 glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-substitution"
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-lg text-white font-medium"
            onClick={handleSubstitution}
            disabled={!oldTechnicianId || !newTechnicianId || substitutionMutation.isPending}
            data-testid="button-confirm-substitution"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {substitutionMutation.isPending ? "Substituindo..." : "Substituir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
