import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit, Trash2, Users, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Technician, Team } from "@shared/schema";

interface TechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TechnicianModal({ open, onOpenChange }: TechnicianModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTechName, setNewTechName] = useState("");
  const [newTechCities, setNewTechCities] = useState("");
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamBoxNumber, setNewTeamBoxNumber] = useState("");
  const [newTeamNotes, setNewTeamNotes] = useState("");
  const [selectedTechniciansForNewTeam, setSelectedTechniciansForNewTeam] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const createTechnicianMutation = useMutation({
    mutationFn: async (data: { name: string; cities: string[]; neighborhoods: string[] }) => {
      const response = await apiRequest("POST", "/api/technicians", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setNewTechName("");
      setNewTechCities("");
      setShowAddForm(false);
      toast({ title: "Técnico adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar técnico", variant: "destructive" });
    }
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; cities: string[]; neighborhoods: string[] }) => {
      const response = await apiRequest("PUT", `/api/technicians/${data.id}`, {
        name: data.name,
        cities: data.cities,
        neighborhoods: data.neighborhoods
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setEditingTech(null);
      toast({ title: "Técnico atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar técnico", variant: "destructive" });
    }
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/technicians/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({ title: "Técnico removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover técnico", variant: "destructive" });
    }
  });

  const deleteTeamsMutation = useMutation({
    mutationFn: async (teamIds: string[]) => {
      const promises = teamIds.map(id => apiRequest("DELETE", `/api/teams/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setSelectedTeams([]);
      toast({ title: "Equipes removidas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover equipes", variant: "destructive" });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; boxNumber: string; notes?: string; technicianIds: string[] }) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setNewTeamName("");
      setNewTeamBoxNumber("");
      setNewTeamNotes("");
      setSelectedTechniciansForNewTeam([]);
      setShowAddTeamForm(false);
      toast({ title: "Equipe criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar equipe", variant: "destructive" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; boxNumber: string; notes?: string }) => {
      const response = await apiRequest("PUT", `/api/teams/${data.id}`, {
        name: data.name,
        boxNumber: data.boxNumber,
        notes: data.notes,
        technicianIds: editingTeam?.technicianIds || []
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEditingTeam(null);
      toast({ title: "Equipe atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar equipe", variant: "destructive" });
    }
  });

  const toggleTeamStatusMutation = useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/teams/${data.id}`, {
        isActive: data.isActive
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ 
        title: variables.isActive ? "Equipe ativada com sucesso!" : "Equipe desativada com sucesso!" 
      });
    },
    onError: () => {
      toast({ title: "Erro ao alterar status da equipe", variant: "destructive" });
    }
  });

  const handleAddTechnician = () => {
    if (!newTechName.trim()) return;
    
    createTechnicianMutation.mutate({
      name: newTechName.trim(),
      cities: [],
      neighborhoods: []
    });
  };

  const handleUpdateTechnician = () => {
    if (!editingTech || !editingTech.name.trim()) return;
    
    updateTechnicianMutation.mutate({
      id: editingTech.id,
      name: editingTech.name,
      cities: [],
      neighborhoods: []
    });
  };

  const handleAddTeam = () => {
    if (!newTeamBoxNumber.trim() || selectedTechniciansForNewTeam.length === 0) return;
    
    // Gerar nome da equipe baseado nos técnicos selecionados
    const selectedTechNames = selectedTechniciansForNewTeam
      .map(id => technicians.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(" E ");
    
    createTeamMutation.mutate({
      name: selectedTechNames,
      boxNumber: newTeamBoxNumber.trim(),
      notes: newTeamNotes.trim() || undefined,
      technicianIds: selectedTechniciansForNewTeam
    });
  };

  const handleUpdateTeam = () => {
    if (!editingTeam || !editingTeam.name.trim() || !editingTeam.boxNumber.trim()) return;

    updateTeamMutation.mutate({
      id: editingTeam.id,
      name: editingTeam.name,
      boxNumber: editingTeam.boxNumber,
      notes: editingTeam.notes || ""
    });
  };

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeams(prev => 
      checked 
        ? [...prev, teamId]
        : prev.filter(id => id !== teamId)
    );
  };

  const handleSelectAllTeams = (checked: boolean) => {
    setSelectedTeams(checked ? teams.map(team => team.id) : []);
  };

  const handleDeleteSelectedTeams = () => {
    if (selectedTeams.length === 0) return;
    deleteTeamsMutation.mutate(selectedTeams);
  };

  const handleToggleTeamStatus = (teamId: string, isActive: boolean) => {
    toggleTeamStatusMutation.mutate({ id: teamId, isActive });
  };

  const handleTechnicianSelectionForNewTeam = (technicianId: string, checked: boolean) => {
    setSelectedTechniciansForNewTeam(prev => {
      if (checked) {
        // Máximo 3 técnicos por equipe
        if (prev.length >= 3) {
          toast({ title: "Máximo 3 técnicos por equipe", variant: "destructive" });
          return prev;
        }
        return [...prev, technicianId];
      } else {
        return prev.filter(id => id !== technicianId);
      }
    });
  };

  const getAvailableTechnicians = () => {
    // Filtrar técnicos que não estão em nenhuma equipe ativa
    return technicians
      .filter(tech => {
        const teamForTech = teams.find(team => 
          team.isActive && team.technicianIds.includes(tech.id)
        );
        return !teamForTech;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  };

  const getGroupedTechnicians = () => {
    const availableTechs = getAvailableTechnicians();
    const groups: { [letter: string]: typeof availableTechs } = {};
    
    availableTechs.forEach(tech => {
      const firstLetter = tech.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(tech);
    });
    
    return Object.keys(groups)
      .sort()
      .map(letter => ({
        letter,
        technicians: groups[letter]
      }));
  };

  const getTeamForTechnician = (techId: string) => {
    return teams.find(team => team.technicianIds.includes(techId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Gerenciar Técnicos
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-technician-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col h-full min-h-0">
            <h4 className="text-lg font-medium text-white mb-4">Técnicos Disponíveis</h4>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {technicians.map((technician) => {
                const team = getTeamForTechnician(technician.id);
                const isEditing = editingTech?.id === technician.id;

                return (
                  <div key={technician.id} className="glass-card p-4 rounded-lg" data-testid={`technician-${technician.name.replace(/\s+/g, "-").toLowerCase()}`}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTech.name}
                          onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                          className="bg-secondary border border-border text-white"
                          placeholder="Nome do técnico"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={handleUpdateTechnician}
                            disabled={updateTechnicianMutation.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button text-white border-border"
                            onClick={() => setEditingTech(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{technician.name}</span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="glass-button px-2 py-1 rounded text-xs text-white"
                              onClick={() => setEditingTech(technician)}
                              data-testid={`button-edit-${technician.name.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="glass-button px-2 py-1 rounded text-xs text-white hover:text-red-400"
                              onClick={() => deleteTechnicianMutation.mutate(technician.id)}
                              disabled={deleteTechnicianMutation.isPending}
                              data-testid={`button-delete-${technician.name.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {team && (
                            <div className="text-primary text-xs">
                              Equipe: {team.name}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {showAddForm ? (
              <div className="mt-4 glass-card p-4 rounded-lg space-y-3">
                <Input
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  className="bg-secondary border border-border text-white"
                  placeholder="Nome do técnico"
                  data-testid="input-new-technician-name"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddTechnician}
                    disabled={createTechnicianMutation.isPending}
                    data-testid="button-save-technician"
                  >
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-button text-white border-border"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTechName("");
                      setNewTechCities("");
                    }}
                    data-testid="button-cancel-technician"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full mt-4 glass-button p-3 rounded-lg text-white font-medium"
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-technician"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Técnico
              </Button>
            )}
          </div>

          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">Todas as Equipes</h4>
              <div className="flex items-center space-x-3">
                {selectedTeams.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelectedTeams}
                    disabled={deleteTeamsMutation.isPending}
                    data-testid="button-delete-selected-teams"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir ({selectedTeams.length})
                  </Button>
                )}
              </div>
            </div>

            {teams.length > 0 && (
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="select-all-teams"
                  checked={selectedTeams.length === teams.length}
                  onCheckedChange={handleSelectAllTeams}
                />
                <label htmlFor="select-all-teams" className="text-sm text-white cursor-pointer">
                  Selecionar todas ({teams.length} equipes)
                </label>
              </div>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto">
              {teams.map((team) => {
                const teamTechnicians = team.technicianIds
                  .map(id => technicians.find(t => t.id === id))
                  .filter(Boolean);
                const isEditing = editingTeam?.id === team.id;

                return (
                  <div key={team.id} className="glass-card p-4 rounded-lg" data-testid={`team-${team.name.replace(/\s+/g, "-").toLowerCase()}`}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editingTeam.name}
                          onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                          className="bg-secondary border border-border text-white"
                          placeholder="Nome da equipe"
                        />
                        <Input
                          value={editingTeam.boxNumber}
                          onChange={(e) => setEditingTeam({ ...editingTeam, boxNumber: e.target.value })}
                          className="bg-secondary border border-border text-white"
                          placeholder="Número da caixa"
                        />
                        <Input
                          value={editingTeam.notes || ""}
                          onChange={(e) => setEditingTeam({ ...editingTeam, notes: e.target.value })}
                          className="bg-secondary border border-border text-white"
                          placeholder="Observações da equipe (ex: não pode passar do horário)"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={handleUpdateTeam}
                            disabled={updateTeamMutation.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button text-white border-border"
                            onClick={() => setEditingTeam(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 mb-2">
                          <Checkbox
                            id={team.id}
                            checked={selectedTeams.includes(team.id)}
                            onCheckedChange={(checked) => handleTeamSelection(team.id, checked as boolean)}
                          />
                          <div className="flex items-center justify-between flex-1">
                            <div className="flex items-center space-x-3">
                              <span className={`font-medium ${team.isActive ? 'text-white' : 'text-muted-foreground'}`}>
                                {team.name}
                              </span>
                              {!team.isActive && (
                                <span className="text-xs bg-red-600 px-2 py-1 rounded-full text-white">
                                  DESATIVADA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`team-status-${team.id}`} className="text-xs text-muted-foreground">
                                  {team.isActive ? 'Ativo' : 'Inativo'}
                                </Label>
                                <Switch
                                  id={`team-status-${team.id}`}
                                  checked={team.isActive}
                                  onCheckedChange={(checked) => handleToggleTeamStatus(team.id, checked)}
                                  disabled={toggleTeamStatusMutation.isPending}
                                  data-testid={`switch-team-status-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                                />
                              </div>
                              <span className="text-xs bg-primary px-2 py-1 rounded-full text-white">
                                {team.boxNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          <div>Técnicos: {teamTechnicians.map(t => t?.name).join(", ") || "Nenhum"}</div>
                          {team.notes && (
                            <div className="text-yellow-400 mt-1 flex items-center">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {team.notes}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="glass-button px-3 py-1 rounded text-xs text-white"
                          onClick={() => setEditingTeam(team)}
                          data-testid={`button-modify-team-${team.name.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Modificar Equipe
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

{showAddTeamForm ? (
              <div className="mt-4 glass-card p-4 rounded-lg space-y-4">
                <div>
                  <Label className="text-sm font-medium text-white mb-3 block">
                    Selecionar Técnicos (máximo 3)
                  </Label>
                  {getAvailableTechnicians().length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Não há técnicos disponíveis
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {getGroupedTechnicians().map((group) => (
                        <div key={group.letter} className="space-y-2">
                          <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            {group.letter}
                          </div>
                          <div className="space-y-2 pl-2">
                            {group.technicians.map((technician) => (
                              <div key={technician.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`new-team-tech-${technician.id}`}
                                  checked={selectedTechniciansForNewTeam.includes(technician.id)}
                                  onCheckedChange={(checked) => 
                                    handleTechnicianSelectionForNewTeam(technician.id, checked as boolean)
                                  }
                                  disabled={
                                    !selectedTechniciansForNewTeam.includes(technician.id) && 
                                    selectedTechniciansForNewTeam.length >= 3
                                  }
                                />
                                <Label 
                                  htmlFor={`new-team-tech-${technician.id}`} 
                                  className="text-sm text-white cursor-pointer"
                                >
                                  {technician.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Input
                  value={newTeamBoxNumber}
                  onChange={(e) => setNewTeamBoxNumber(e.target.value)}
                  className="bg-secondary border border-border text-white"
                  placeholder="Número da caixa"
                  data-testid="input-new-team-box-number"
                />
                
                <Input
                  value={newTeamNotes}
                  onChange={(e) => setNewTeamNotes(e.target.value)}
                  className="bg-secondary border border-border text-white"
                  placeholder="Observações da equipe (opcional)"
                  data-testid="input-new-team-notes"
                />
                
                {selectedTechniciansForNewTeam.length > 0 && (
                  <div className="text-sm text-primary">
                    Nome da equipe: {selectedTechniciansForNewTeam
                      .map(id => technicians.find(t => t.id === id)?.name)
                      .filter(Boolean)
                      .join(" E ")}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddTeam}
                    disabled={
                      createTeamMutation.isPending || 
                      selectedTechniciansForNewTeam.length === 0 || 
                      !newTeamBoxNumber.trim()
                    }
                    data-testid="button-save-team"
                  >
                    Criar Equipe
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-button text-white border-border"
                    onClick={() => {
                      setShowAddTeamForm(false);
                      setNewTeamName("");
                      setNewTeamBoxNumber("");
                      setNewTeamNotes("");
                      setSelectedTechniciansForNewTeam([]);
                    }}
                    data-testid="button-cancel-team"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full mt-4 glass-button p-3 rounded-lg text-white font-medium"
                onClick={() => setShowAddTeamForm(true)}
                data-testid="button-create-team"
              >
                <Users className="mr-2 h-4 w-4" />
                Criar Nova Equipe
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
