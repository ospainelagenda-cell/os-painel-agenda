import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Users, UserMinus, UserPlus, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, Technician, ServiceOrder } from "@shared/schema";

interface ManageTechniciansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onTechnicianWithServices?: (
    technicianId: string, 
    technicianName: string, 
    serviceOrders: ServiceOrder[],
    action: 'remove' | 'move',
    targetTeamId?: string
  ) => void;
}

export default function ManageTechniciansModal({ 
  open, 
  onOpenChange, 
  teamId, 
  onTechnicianWithServices 
}: ManageTechniciansModalProps) {
  const [selectedTechnicianToAdd, setSelectedTechnicianToAdd] = useState("");
  const [selectedTechnicianToMove, setSelectedTechnicianToMove] = useState("");
  const [targetTeamForMove, setTargetTeamForMove] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const currentTeam = teams.find(team => team.id === teamId);
  const otherTeams = teams.filter(team => team.id !== teamId);
  
  // Técnicos atuais da equipe
  const currentTechnicians = currentTeam?.technicianIds
    .map(id => technicians.find(tech => tech.id === id))
    .filter((tech): tech is Technician => tech !== undefined) || [];

  // Técnicos disponíveis (não estão em nenhuma equipe)
  const availableTechnicians = technicians.filter(tech => 
    !teams.some(team => team.technicianIds.includes(tech.id))
  );

  const getTechnicianServices = (technicianId: string) => {
    return serviceOrders.filter(order => 
      order.technicianId === technicianId && 
      order.status !== "Concluído" && 
      order.status !== "Cancelado"
    );
  };

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { teamId: string; technicianIds: string[] }) => {
      const team = teams.find(t => t.id === data.teamId);
      if (!team) throw new Error("Equipe não encontrada");
      
      const response = await apiRequest("PUT", `/api/teams/${data.teamId}`, {
        name: team.name,
        boxNumber: team.boxNumber,
        notes: team.notes,
        technicianIds: data.technicianIds
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setSelectedTechnicianToAdd("");
      setSelectedTechnicianToMove("");
      setTargetTeamForMove("");
      toast({ title: "Técnicos atualizados com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar técnicos", variant: "destructive" });
    }
  });

  const handleAddTechnician = () => {
    if (!selectedTechnicianToAdd || !currentTeam) return;
    
    const newTechnicianIds = [...currentTeam.technicianIds, selectedTechnicianToAdd];
    updateTeamMutation.mutate({
      teamId: teamId,
      technicianIds: newTechnicianIds
    });
  };

  const handleRemoveTechnician = (technicianId: string) => {
    if (!currentTeam) return;
    
    const technician = technicians.find(tech => tech.id === technicianId);
    const technicianServices = getTechnicianServices(technicianId);
    
    if (technicianServices.length > 0 && technician) {
      // Se tem serviços ativos, chama callback para realocar
      onTechnicianWithServices?.(technicianId, technician.name, technicianServices, 'remove');
      onOpenChange(false); // Fecha este modal enquanto realoca
    } else {
      // Se não tem serviços, remove diretamente
      const newTechnicianIds = currentTeam.technicianIds.filter(id => id !== technicianId);
      updateTeamMutation.mutate({
        teamId: teamId,
        technicianIds: newTechnicianIds
      });
    }
  };

  const handleMoveTechnician = () => {
    if (!selectedTechnicianToMove || !targetTeamForMove || !currentTeam) return;
    
    const technician = technicians.find(tech => tech.id === selectedTechnicianToMove);
    const technicianServices = getTechnicianServices(selectedTechnicianToMove);
    const targetTeam = teams.find(team => team.id === targetTeamForMove);
    
    if (technicianServices.length > 0 && technician) {
      // Se tem serviços ativos, chama callback para realocar
      onTechnicianWithServices?.(selectedTechnicianToMove, technician.name, technicianServices, 'move', targetTeamForMove);
      onOpenChange(false); // Fecha este modal enquanto realoca
    } else {
      // Se não tem serviços, move diretamente
      // Remove da equipe atual
      const currentTeamNewIds = currentTeam.technicianIds.filter(id => id !== selectedTechnicianToMove);
      // Adiciona na equipe de destino
      const targetTeamNewIds = [...(targetTeam?.technicianIds || []), selectedTechnicianToMove];
      
      Promise.all([
        updateTeamMutation.mutateAsync({ teamId: teamId, technicianIds: currentTeamNewIds }),
        updateTeamMutation.mutateAsync({ teamId: targetTeamForMove, technicianIds: targetTeamNewIds })
      ]);
    }
  };

  if (!currentTeam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Gerenciar Técnicos - {currentTeam.boxNumber}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Técnicos Atuais */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Técnicos Atuais</h3>
            {currentTechnicians.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum técnico atribuído
              </div>
            ) : (
              <div className="space-y-2">
                {currentTechnicians.map((technician) => {
                  const services = getTechnicianServices(technician.id);
                  return (
                    <div key={technician.id} className="flex items-center justify-between glass-card p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">{technician.name}</span>
                        {services.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {services.length} OS ativas
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => handleRemoveTechnician(technician.id)}
                      >
                        <UserMinus className="mr-1 h-3 w-3" />
                        Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adicionar Técnico */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Adicionar Técnico</h3>
            {availableTechnicians.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Não há técnicos disponíveis. Todos os técnicos já estão atribuídos a equipes.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex space-x-3">
                <Select value={selectedTechnicianToAdd} onValueChange={setSelectedTechnicianToAdd}>
                  <SelectTrigger className="flex-1 bg-secondary border border-border text-white">
                    <SelectValue placeholder="Selecione um técnico disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechnicians.map((technician) => (
                      <SelectItem key={technician.id} value={technician.id}>
                        {technician.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddTechnician}
                  disabled={!selectedTechnicianToAdd || updateTeamMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          {/* Mover Técnico para Outra Equipe */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Mover Técnico para Outra Equipe</h3>
            {currentTechnicians.length === 0 || otherTeams.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {currentTechnicians.length === 0 
                    ? "Não há técnicos nesta equipe para mover."
                    : "Não há outras equipes disponíveis."
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Select value={selectedTechnicianToMove} onValueChange={setSelectedTechnicianToMove}>
                    <SelectTrigger className="flex-1 bg-secondary border border-border text-white">
                      <SelectValue placeholder="Selecione técnico para mover" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentTechnicians.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id}>
                          {technician.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground mt-3" />
                  <Select value={targetTeamForMove} onValueChange={setTargetTeamForMove}>
                    <SelectTrigger className="flex-1 bg-secondary border border-border text-white">
                      <SelectValue placeholder="Selecione equipe de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} - {team.boxNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleMoveTechnician}
                  disabled={!selectedTechnicianToMove || !targetTeamForMove || updateTeamMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Mover Técnico
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            className="glass-button text-white border-border"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}