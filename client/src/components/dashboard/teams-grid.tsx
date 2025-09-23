import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ArrowRightLeft, Calendar, Plus, AlertTriangle, Check, X, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder, Technician, Report } from "@shared/schema";

interface TeamsGridProps {
  onReallocate: (teamId: string) => void;
  onAddServiceOrder?: (teamId: string) => void;
  onViewTeamServices?: (teamId: string, teamName: string) => void;
  onManageTechnicians?: (teamId: string) => void;
}

// Time-based filtering logic
function getCurrentShift(): 'Manhã' | 'Tarde' | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Manhã: 07:00-13:00 (420-780 minutes)
  if (totalMinutes >= 420 && totalMinutes <= 780) {
    return 'Manhã';
  }
  // Tarde: 13:01-22:00 (781-1320 minutes)
  if (totalMinutes >= 781 && totalMinutes <= 1320) {
    return 'Tarde';
  }
  return null;
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Hook para tempo reativo
function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return currentTime;
}

export default function TeamsGrid({ onReallocate, onAddServiceOrder, onViewTeamServices, onManageTechnicians }: TeamsGridProps) {
  // Time-reactive state
  const currentTime = useCurrentTime();
  
  // Filter state - Default to manual mode showing all dates
  const [filterMode, setFilterMode] = useState<'auto' | 'manual'>('manual');
  const [selectedDate, setSelectedDate] = useState('all');
  
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  
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

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"]
  });

  // Function to extract team names mentioned in reports
  const getTeamsFromReports = (targetDate: string, targetShift: string) => {
    const relevantReports = reports.filter(report => 
      report.date === targetDate && report.shift.toLowerCase() === targetShift.toLowerCase()
    );
    
    if (relevantReports.length === 0) {
      return [];
    }
    
    const teamNames = new Set<string>();
    
    relevantReports.forEach(report => {
      // Extract team names from report content
      // Format: "EQUIPE: VICTOR F. E SHELBERT (CAIXA-01)" or "VICTOR F. E SHELBERT: (CAIXA - 01)"
      const teamRegex = /(?:EQUIPE:\s+)?([A-ZÁÉÍÓÚÀÂÊÔÇ\s]+)(?:\s*:\s*)?\(CAIXA\s*-?\s*\d+\)/gi;
      const matches = Array.from(report.content.matchAll(teamRegex));
      
      matches.forEach(match => {
        const teamName = match[1].trim().toUpperCase();
        teamNames.add(teamName);
      });
    });
    
    return Array.from(teamNames);
  };

  // Function to get team display name (same format as in reports)
  const getTeamDisplayName = (team: Team) => {
    const technicianNames = team.technicianIds
      .map(technicianId => {
        const technician = technicians.find(t => t.id === technicianId);
        return technician ? technician.name.toUpperCase() : '';
      })
      .filter(name => name !== '')
      .join(' E ');
    
    return technicianNames;
  };

  // Function to filter teams based on reports
  const getFilteredTeamsByReports = (targetDate: string | null, targetShift: string | null) => {
    if (!targetDate || !targetShift) {
      return []; // If no date/shift, don't show any teams
    }
    
    const teamsInReports = getTeamsFromReports(targetDate, targetShift);
    
    if (teamsInReports.length === 0) {
      return []; // If no teams in reports, don't show any teams
    }
    
    return teams.filter(team => {
      const teamDisplayName = getTeamDisplayName(team);
      return teamsInReports.some(reportTeamName => 
        teamDisplayName === reportTeamName ||
        reportTeamName.includes(teamDisplayName) ||
        teamDisplayName.includes(reportTeamName)
      );
    });
  };


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

  // Auto-filtered date logic (depends on currentTime for reactivity)
  const getAutoFilteredDate = useMemo(() => {
    const currentShift = getCurrentShift();
    const currentDate = getLocalDateString();
    
    if (!currentShift) return null;
    
    // Morning shift (07:00-13:00): Shows services scheduled for today
    if (currentShift === 'Manhã') {
      return currentDate;
    }
    
    // Afternoon shift (13:01-22:00): Shows services scheduled for today  
    if (currentShift === 'Tarde') {
      return currentDate;
    }
    
    return null;
  }, [currentTime]);
  
  const getDisplayDate = () => {
    if (filterMode === 'auto') {
      return getAutoFilteredDate;
    }
    return selectedDate === 'all' ? null : selectedDate;
  };
  
  const displayDate = getDisplayDate();
  const currentShift = getCurrentShift();
  const isInOperatingHours = currentShift !== null;
  const isAutoMode = filterMode === 'auto';
  const isShowingAutoDate = isAutoMode && displayDate === getAutoFilteredDate;
  
  const getTechnicianNames = (technicianIds: string[]) => {
    const names = technicianIds
      .map(id => technicians.find(tech => tech.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Nenhum técnico atribuído";
  };

  const getTeamServiceOrders = (teamId: string) => {
    const matchesTeam = (order: ServiceOrder) => order.teamId === teamId;
    
    // Auto mode outside operating hours: show no services
    if (filterMode === 'auto' && !isInOperatingHours) {
      return [];
    }
    
    // Manual mode with no date selected: show all services for the team
    const showAllDates = filterMode === 'manual' && selectedDate === 'all';
    if (showAllDates) {
      return serviceOrders.filter(matchesTeam);
    }
    
    // Filter by date when a specific date is selected/auto-determined
    if (!displayDate) {
      return serviceOrders.filter(matchesTeam);
    }
    
    return serviceOrders.filter(order => {
      return matchesTeam(order) && order.scheduledDate === displayDate;
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
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Todas as datas';
    try {
      // Parse YYYY-MM-DD without timezone issues
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };
  
  const getShiftColor = (shift: string | null) => {
    if (!shift) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    
    switch (shift.toLowerCase()) {
      case 'manhã':
      case 'manha':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'tarde':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };
  
  // Generate available date options from service orders
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(
      serviceOrders
        .map(order => order.scheduledDate)
        .filter((date): date is string => Boolean(date))
        .sort()
    ));
    return dates;
  }, [serviceOrders]);

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
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">Equipes e Serviços</h2>
          {isShowingAutoDate && isInOperatingHours && currentShift && (
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getShiftColor(currentShift)}`}>
                {currentShift}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Atual
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-6">
          <div className="flex items-center space-x-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Filtro:
            </Label>
            
            {/* Filter Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={filterMode === 'auto' ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setFilterMode('auto')}
              >
                <Clock className="h-3 w-3 mr-1" />
                Automático
              </Button>
              <Button
                variant={filterMode === 'manual' ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setFilterMode('manual')}
              >
                Manual
              </Button>
            </div>
            
            {/* Manual Date Selection */}
            {filterMode === 'manual' && (
              <>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-48 bg-secondary border border-border text-white text-sm">
                    <SelectValue placeholder="Selecione uma data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as datas</SelectItem>
                    {availableDates.map(date => (
                      <SelectItem key={date} value={date}>
                        {formatDate(date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            
            {/* Current Filter Display */}
            <div className="text-xs text-muted-foreground">
              Exibindo: {formatDate(displayDate)}
              {isAutoMode && !isInOperatingHours && (
                <span className="text-amber-400 ml-2">Fora do horário - Nenhum serviço</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          // Filter teams based on reports - only show teams that appear in reports
          let filteredTeams: Team[] = [];
          
          if (filterMode === 'auto') {
            // In auto mode, use current date and shift
            const currentShift = getCurrentShift();
            if (currentShift && isInOperatingHours) {
              filteredTeams = getFilteredTeamsByReports(getLocalDateString(), currentShift);
            }
          } else {
            // In manual mode, use selected date
            if (selectedDate !== 'all' && selectedDate) {
              // For manual mode, we need to determine the shift
              // We'll check both shifts and combine results
              const morningTeams = getFilteredTeamsByReports(selectedDate, 'Manhã');
              const afternoonTeams = getFilteredTeamsByReports(selectedDate, 'Tarde');
              // Combine and deduplicate teams
              const combinedTeams = [...morningTeams, ...afternoonTeams];
              filteredTeams = combinedTeams.filter((team, index, self) => 
                index === self.findIndex(t => t.id === team.id)
              );
            }
          }
          
          return filteredTeams.map((team) => {
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
                  <h3 className="font-semibold text-white">{getTechnicianNames(team.technicianIds)}</h3>
                  {allServicesCompleted && teamServiceOrders.length > 0 && (
                    <span className="text-xs text-green-400 font-medium mt-1">✓ Equipe Livre</span>
                  )}
                  {teamServiceOrders.length === 0 && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {isAutoMode && !isInOperatingHours 
                        ? 'Fora do horário de operação'
                        : displayDate 
                          ? `Sem serviços para ${formatDate(displayDate)}`
                          : 'Sem serviços atribuídos'
                      }
                    </span>
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
                    <Button
                      className="flex-1 glass-button py-2 rounded-lg text-xs text-white bg-blue-500/20 hover:bg-blue-500/30"
                      onClick={() => onManageTechnicians?.(team.id)}
                      data-testid={`button-manage-technicians-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}
