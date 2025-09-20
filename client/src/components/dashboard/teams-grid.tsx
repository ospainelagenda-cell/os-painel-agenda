import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ArrowRightLeft, Calendar, Plus, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder } from "@shared/schema";

interface TeamsGridProps {
  onReallocate: (teamId: string) => void;
  onAddServiceOrder?: (teamId: string) => void;
  onViewTeamServices?: (teamId: string, teamName: string) => void;
}

export default function TeamsGrid({ onReallocate, onAddServiceOrder, onViewTeamServices }: TeamsGridProps) {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });


  const updateTeamNotesMutation = useMutation({
    mutationFn: async (data: { id: string; notes: string; team: Team }) => {
      const response = await apiRequest("PUT", `/api/teams/${data.id}`, {
        name: data.team.name,
        boxNumber: data.team.boxNumber,
        notes: data.notes,
        technicianIds: data.team.technicianIds
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEditingNotes(null);
      setNotesInput("");
      toast({ title: "Observações atualizadas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar observações", variant: "destructive" });
    }
  });

  const handleStartEditingNotes = (teamId: string, currentNotes: string) => {
    setEditingNotes(teamId);
    setNotesInput(currentNotes || "");
  };

  const handleSaveNotes = (team: Team) => {
    updateTeamNotesMutation.mutate({
      id: team.id,
      notes: notesInput.trim(),
      team: team
    });
  };

  const handleCancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesInput("");
  };

  const getTeamServiceOrders = (teamId: string) => {
    return serviceOrders.filter(order => {
      const matchesTeam = order.teamId === teamId;
      if (!selectedDate) return matchesTeam;
      return matchesTeam && order.scheduledDate === selectedDate;
    });
  };

  const getStatusCounts = (teamServiceOrders: ServiceOrder[]) => {
    const completed = teamServiceOrders.filter(order => order.status === "Concluído").length;
    const pending = teamServiceOrders.filter(order => order.status === "Pendente").length;
    const rescheduled = teamServiceOrders.filter(order => order.status === "Reagendado").length;
    const adesivado = teamServiceOrders.filter(order => order.status === "Adesivado").length;
    const cancelled = teamServiceOrders.filter(order => order.status === "Cancelado").length;
    
    return { completed, pending, rescheduled, adesivado, cancelled };
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Concluído":
        return "status-completed";
      case "Pendente":
        return "status-pending";
      case "Reagendado":
        return "status-rescheduled";
      case "Adesivado":
        return "status-adesivado";
      case "Cancelado":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  if (teams.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Equipes e Serviços</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma equipe cadastrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-4 lg:space-y-0">
        <h2 className="text-xl font-semibold text-white">Equipes e Serviços</h2>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-6">
          <div className="flex items-center space-x-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Filtrar por data:
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-filter-date"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-white"
                onClick={() => setSelectedDate("")}
                data-testid="button-clear-date-filter"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const teamServiceOrders = getTeamServiceOrders(team.id);
          const { completed, pending, rescheduled, adesivado, cancelled } = getStatusCounts(teamServiceOrders);
          const allServicesCompleted = teamServiceOrders.length > 0 && pending === 0 && rescheduled === 0 && adesivado === 0;

          return (
            <div
              key={team.id}
              className={`rounded-xl p-6 team-card transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                allServicesCompleted 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-700/30 border border-green-400/30' 
                  : 'glass-card'
              }`}
              onClick={(e) => {
                // Evitar que clique em botões dispare o evento do card
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('input')) {
                  return;
                }
                onViewTeamServices?.(team.id, team.name);
              }}
              data-testid={`team-card-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  {allServicesCompleted && (
                    <span className="text-xs text-green-400 font-medium mt-1">✓ Equipe Livre</span>
                  )}
                  {editingNotes === team.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="Ex: não pode passar do horário, disponível apenas pela manhã..."
                        className="bg-secondary border border-border text-white text-xs h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNotes(team);
                          } else if (e.key === 'Escape') {
                            handleCancelEditingNotes();
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white px-2 py-1 h-6 text-xs"
                          onClick={() => handleSaveNotes(team)}
                          disabled={updateTeamNotesMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass-button text-white border-border px-2 py-1 h-6 text-xs"
                          onClick={handleCancelEditingNotes}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : team.notes ? (
                    <span className="text-xs text-yellow-400 font-medium mt-1 flex items-center">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {team.notes}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 p-0 h-auto text-yellow-400 hover:text-yellow-300"
                        onClick={() => handleStartEditingNotes(team.id, team.notes || "")}
                        data-testid={`button-edit-notes-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-yellow-400 mt-1 p-0 h-auto flex items-center"
                      onClick={() => handleStartEditingNotes(team.id, "")}
                      data-testid={`button-add-notes-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar observações
                    </Button>
                  )}
                </div>
                <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">
                  {team.boxNumber}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2 text-sm flex-wrap">
                  <div className="text-center">
                    <div className="font-bold text-sm text-green-400">{completed}</div>
                    <div className="text-muted-foreground text-xs">Concluído</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-amber-400">{pending}</div>
                    <div className="text-muted-foreground text-xs">Pendente</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-red-400">{rescheduled}</div>
                    <div className="text-muted-foreground text-xs">Reagendado</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-blue-400">{adesivado}</div>
                    <div className="text-muted-foreground text-xs">Adesivado</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-gray-400">{cancelled}</div>
                    <div className="text-muted-foreground text-xs">Cancelado</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {teamServiceOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Nenhum serviço atribuído</p>
                  </div>
                ) : (
                  teamServiceOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between text-sm"
                      data-testid={`service-order-${order.code}`}
                    >
                      <span className="text-muted-foreground">
                        #{order.code} {order.type}
                        {order.alert && (
                          <span className="ml-2 text-xs text-amber-400">⚠</span>
                        )}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${getStatusClass(order.status)}`}></div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    className="w-full glass-button py-2 rounded-lg text-xs text-white bg-primary/20 hover:bg-primary/30"
                    onClick={() => onAddServiceOrder?.(team.id)}
                    data-testid={`button-add-service-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar mais OS
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 glass-button py-2 rounded-lg text-xs text-white"
                      onClick={() => onReallocate(team.id)}
                      data-testid={`button-reallocate-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <ArrowRightLeft className="mr-1 h-3 w-3" />
                      Realocar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
