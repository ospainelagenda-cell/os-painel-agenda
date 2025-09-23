import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, MapPin, Home, Edit3, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder, City, Neighborhood, Technician } from "@shared/schema";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (content: string, name?: string, date?: string, shift?: string) => void;
  editMode?: boolean;
  existingReportName?: string;
  existingReportDate?: string;
  existingReportShift?: string;
}

interface NewServiceOrder {
  code: string;
  type: string;
  alert: string;
  cityId: string;
  neighborhoodId: string;
}

interface BoxData {
  boxNumber: string;
  technicianIds: string[];
  teamId?: string;
  serviceOrders: NewServiceOrder[];
}

export default function ReportModal({ 
  open, 
  onOpenChange, 
  onReportGenerated, 
  editMode = false,
  existingReportName = "",
  existingReportDate = "",
  existingReportShift = ""
}: ReportModalProps) {
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [shift, setShift] = useState("");
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [editingBoxIndex, setEditingBoxIndex] = useState<number | null>(null);
  const [editingBoxValue, setEditingBoxValue] = useState("");
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  // Initialize fields when in edit mode
  useEffect(() => {
    if (open && editMode) {
      setReportName(existingReportName);
      setReportDate(existingReportDate);
      setShift(existingReportShift);
      
      // Load existing teams as boxes when editing
      const existingBoxes: BoxData[] = teams.map(team => ({
        boxNumber: team.boxNumber,
        technicianIds: team.technicianIds,
        teamId: team.id,
        serviceOrders: serviceOrders
          .filter(order => order.teamId === team.id)
          .map(order => ({
            code: order.code,
            type: order.type,
            alert: order.alert || "",
            cityId: order.address || "", // Using address field for now
            neighborhoodId: order.address || ""
          }))
      }));
      setBoxes(existingBoxes);
    } else if (open && !editMode) {
      // Reset fields for new report
      setReportName("");
      setReportDate(new Date().toISOString().split('T')[0]);
      setShift("");
      setBoxes([]);
      setSelectedBoxIndex(null);
    }
  }, [open, editMode, existingReportName, existingReportDate, existingReportShift, teams, serviceOrders]);

  const createServiceOrderMutation = useMutation({
    mutationFn: async (orderWithAssignment: NewServiceOrder & { technicianId: string; teamId?: string }) => {
      const response = await apiRequest("POST", "/api/service-orders", {
        code: orderWithAssignment.code,
        type: orderWithAssignment.type,
        teamId: orderWithAssignment.teamId || null,
        technicianId: orderWithAssignment.technicianId,
        alert: orderWithAssignment.alert || undefined,
        scheduledDate: reportDate,
        status: "Pendente",
        ...(orderWithAssignment.cityId && { cityId: orderWithAssignment.cityId }),
        ...(orderWithAssignment.neighborhoodId && { neighborhoodId: orderWithAssignment.neighborhoodId })
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    },
    onError: () => {
      toast({ title: "Erro ao criar ordem de serviço", variant: "destructive" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, boxNumber }: { teamId: string; boxNumber: string }) => {
      const response = await apiRequest("PUT", `/api/teams/${teamId}`, {
        boxNumber: boxNumber
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar equipe:", error);
      toast({ title: "Erro ao atualizar número da caixa da equipe", variant: "destructive" });
    }
  });

  const addBox = () => {
    const newBoxNumber = `caixa-${boxes.length + 1}`;
    setBoxes(prev => [...prev, { boxNumber: newBoxNumber, technicianIds: [], serviceOrders: [] }]);
  };

  const removeBox = (index: number) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
    if (selectedBoxIndex === index) {
      setSelectedBoxIndex(null);
    } else if (selectedBoxIndex !== null && selectedBoxIndex > index) {
      setSelectedBoxIndex(selectedBoxIndex - 1);
    }
    
    // Nenhuma limpeza adicional necessária para service orders
    // já que elas não dependem mais de boxIndex/technicianId
  };

  const handleEditBoxNumber = (index: number, currentValue: string) => {
    setEditingBoxIndex(index);
    setEditingBoxValue(currentValue);
  };

  const handleSaveBoxNumber = (index: number) => {
    if (editingBoxValue.trim() === "") {
      toast({ title: "O número da caixa não pode estar vazio", variant: "destructive" });
      return;
    }

    // Verificar se já existe uma caixa com este número
    const boxExists = boxes.some((box, i) => i !== index && box.boxNumber === editingBoxValue.trim());
    if (boxExists) {
      toast({ title: "Já existe uma caixa com este número", variant: "destructive" });
      return;
    }

    setBoxes(prev => prev.map((box, i) => {
      if (i === index) {
        return { ...box, boxNumber: editingBoxValue.trim() };
      }
      return box;
    }));

    setEditingBoxIndex(null);
    setEditingBoxValue("");
    toast({ title: "Número da caixa atualizado com sucesso" });
  };

  const resetModalState = () => {
    setReportName("");
    setReportDate("");
    setShift("");
    setBoxes([]);
    setSelectedBoxIndex(null);
    setEditingBoxIndex(null);
    setEditingBoxValue("");
    setTechnicianModalOpen(false);
  };

  const updateBoxTechnicians = (index: number, technicianIds: string[]) => {
    // Encontrar técnicos adicionados (novos)
    const currentBox = boxes[index];
    const addedTechnicians = technicianIds.filter(id => !currentBox.technicianIds.includes(id));
    
    setBoxes(prev => prev.map((box, i) => {
      if (i === index) {
        // Atualizar caixa atual
        return { ...box, technicianIds };
      } else {
        // Remover técnicos adicionados de outras caixas para garantir unicidade
        return { ...box, technicianIds: box.technicianIds.filter(id => !addedTechnicians.includes(id)) };
      }
    }));
    
    // Nenhuma limpeza adicional necessária para service orders
    // já que elas não dependem mais de boxIndex/technicianId
  };


  const generateReport = async () => {
    const validBoxes = boxes.filter(box => box.boxNumber.trim() !== "" && box.technicianIds.length > 0);
    if (!reportName || !reportDate || !shift || validBoxes.length === 0) {
      return;
    }

    // Validar duplicatas de técnicos entre caixas antes de gerar relatório
    const allTechnicianIds: string[] = [];
    const duplicateTechnicians: string[] = [];
    
    validBoxes.forEach(box => {
      box.technicianIds.forEach(techId => {
        if (allTechnicianIds.includes(techId)) {
          if (!duplicateTechnicians.includes(techId)) {
            duplicateTechnicians.push(techId);
          }
        } else {
          allTechnicianIds.push(techId);
        }
      });
    });
    
    if (duplicateTechnicians.length > 0) {
      const duplicateNames = duplicateTechnicians.map(id => {
        const tech = technicians.find(t => t.id === id);
        return tech ? tech.name : id;
      }).join(", ");
      
      console.error(`Erro: Técnicos duplicados encontrados: ${duplicateNames}`);
      alert(`Erro: Os seguintes técnicos estão em múltiplas caixas: ${duplicateNames}. Corrija antes de gerar o relatório.`);
      return;
    }

    // Build team-to-box mapping to detect conflicts BEFORE creating any service orders
    const teamToBoxNumbers = new Map<string, Set<string>>();
    
    // First pass: Build mapping of teams to their assigned box numbers
    validBoxes.forEach(box => {
      const numPart = box.boxNumber.match(/\d+/)?.[0] ?? box.boxNumber;
      const boxNumberFormatted = `CAIXA - ${numPart.padStart(2, '0')}`;
      
      box.technicianIds.forEach(technicianId => {
        const teamForTechnician = teams.find(team => team.technicianIds.includes(technicianId));
        if (teamForTechnician) {
          if (!teamToBoxNumbers.has(teamForTechnician.id)) {
            teamToBoxNumbers.set(teamForTechnician.id, new Set());
          }
          teamToBoxNumbers.get(teamForTechnician.id)!.add(boxNumberFormatted);
        }
      });
    });
    
    // Validate team-to-box consistency (each team should only map to one box)
    const conflictedTeams: string[] = [];
    teamToBoxNumbers.forEach((boxNumbers, teamId) => {
      if (boxNumbers.size > 1) {
        const team = teams.find(t => t.id === teamId);
        const teamName = team?.name || `Team ${teamId}`;
        conflictedTeams.push(`${teamName} (${Array.from(boxNumbers).join(', ')})`);
      }
    });
    
    if (conflictedTeams.length > 0) {
      console.error(`Erro: Equipes com técnicos em múltiplas caixas: ${conflictedTeams.join('; ')}`);
      alert(`Erro: As seguintes equipes têm técnicos em múltiplas caixas: ${conflictedTeams.join('; ')}. Todos os técnicos de uma equipe devem estar na mesma caixa.`);
      return;
    }

    // Create new service orders with proper round-robin assignment
    const allValidOrders: (NewServiceOrder & { boxIndex: number })[] = [];
    
    // Collect all valid orders from all boxes
    boxes.forEach((box, boxIndex) => {
      const validBoxOrders = box.serviceOrders.filter(order => order.code && order.type);
      validBoxOrders.forEach(order => {
        allValidOrders.push({ ...order, boxIndex });
      });
    });
    const availableBoxes = boxes.filter(box => box.boxNumber.trim() !== "" && box.technicianIds.length > 0);
    
    if (allValidOrders.length > 0 && availableBoxes.length === 0) {
      toast({ title: "Erro: Nenhuma caixa configurada para atribuir as ordens de serviço", variant: "destructive" });
      return;
    }
    
    for (const orderWithBox of allValidOrders) {
      const { boxIndex, ...order } = orderWithBox;
      try {
        // Use a specific box for this order
        const selectedBox = boxes[boxIndex];
        if (!selectedBox || selectedBox.technicianIds.length === 0) {
          console.warn(`Caixa ${boxIndex} não tem técnicos atribuídos, pulando ordem ${order.code}`);
          continue;
        }
        
        // Select first technician from the specific box (you can modify this logic as needed)
        const selectedTechnicianId = selectedBox.technicianIds[0];
        
        // Encontrar o team do técnico selecionado
        const selectedTechnician = technicians.find(t => t.id === selectedTechnicianId);
        const teamForTechnician = teams.find(team => team.technicianIds.includes(selectedTechnicianId));
        
        // Avisar se nenhum team foi encontrado para o técnico
        if (!teamForTechnician) {
          console.warn(`Nenhum team encontrado para o técnico ${selectedTechnician?.name || selectedTechnicianId}`);
          toast({ 
            title: `Aviso: Técnico ${selectedTechnician?.name || 'desconhecido'} não pertence a nenhum team`, 
            variant: "default" 
          });
        }
        
        await createServiceOrderMutation.mutateAsync({
          ...order,
          technicianId: selectedTechnicianId,
          teamId: teamForTechnician?.id
        });
      } catch (error) {
        console.error("Error creating service order:", error);
        toast({ title: `Erro ao criar ordem ${order.code}`, variant: "destructive" });
      }
    }
    
    // Update team boxNumbers (using the validated teamToBoxNumbers from earlier)
    const teamsUpdated: string[] = [];
    for (const [teamId, boxNumbers] of Array.from(teamToBoxNumbers.entries())) {
      const boxNumber = Array.from(boxNumbers)[0] as string; // Safe since we validated size = 1
      const currentTeam = teams.find(t => t.id === teamId);
      
      if (currentTeam && currentTeam.boxNumber !== boxNumber) {
        try {
          await updateTeamMutation.mutateAsync({ teamId, boxNumber });
          teamsUpdated.push(currentTeam.name);
          console.log(`Updated team ${currentTeam.name} with boxNumber: ${boxNumber}`);
        } catch (error) {
          console.error(`Failed to update team ${currentTeam.name}:`, error);
          toast({ 
            title: `Erro ao atualizar equipe ${currentTeam.name}`, 
            description: "O número da caixa pode não estar atualizado corretamente.",
            variant: "destructive" 
          });
        }
      }
    }
    
    // Show success message if teams were updated
    if (teamsUpdated.length > 0) {
      toast({
        title: "Caixas atualizadas!",
        description: `Equipes atualizadas: ${teamsUpdated.join(', ')}`,
      });
    }

    // Invalidate and refetch service orders to include newly created ones
    await queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    const updatedServiceOrders = await queryClient.fetchQuery({ 
      queryKey: ["/api/service-orders"], 
      staleTime: 0 
    });

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };

    let content = `Serviços da Agenda: ${formatDate(reportDate)} - TURNO: ${shift.toUpperCase()}\n`;
    content += "-".repeat(57) + "\n\n";

    // Agrupar por Caixa → Técnicos → Service Orders
    validBoxes.forEach(box => {
      // Encontrar service orders para técnicos desta caixa na data especificada
      const boxOrders = (updatedServiceOrders as ServiceOrder[]).filter(order => 
        order.technicianId && box.technicianIds.includes(order.technicianId) && 
        order.scheduledDate === reportDate
      );
      
      if (boxOrders.length > 0) {
        // Encontrar nomes dos técnicos desta caixa
        const technicianNames = box.technicianIds
          .map(technicianId => {
            const technician = technicians.find(t => t.id === technicianId);
            return technician ? technician.name.toUpperCase() : `TÉCNICO ${technicianId}`;
          })
          .join(' E ');
        
        // Extrair número da caixa e formatar com zero à esquerda
        const numPart = box.boxNumber.match(/\d+/)?.[0] ?? box.boxNumber;
        const boxNumberFormatted = numPart.padStart(2, '0');
        
        content += `${technicianNames}: (CAIXA - ${boxNumberFormatted})\n`;
        
        // Coletar todas as ordens desta caixa (de todos os técnicos)
        boxOrders.forEach(order => {
          content += `- ${order.code} ${order.type}\n`;
        });
        
        content += "-".repeat(57) + "\n";
      }
    });

    onReportGenerated(content, reportName, reportDate, shift);
    
    // Reset form
    resetModalState();
  };

  const getNeighborhoodsByCity = (cityId: string): Neighborhood[] => {
    if (!cityId) return [];
    // Since we need dynamic neighborhoods, we'll handle this in the component
    return [];
  };

  const addNewServiceOrder = () => {
    if (selectedBoxIndex === null) {
      toast({ title: "Selecione uma caixa para adicionar ordens de serviço", variant: "destructive" });
      return;
    }
    
    setBoxes(prev => prev.map((box, index) => {
      if (index === selectedBoxIndex) {
        return {
          ...box,
          serviceOrders: [...box.serviceOrders, {
            code: "",
            type: "",
            alert: "",
            cityId: "",
            neighborhoodId: ""
          }]
        };
      }
      return box;
    }));
  };

  const updateServiceOrder = (orderIndex: number, field: keyof NewServiceOrder, value: string) => {
    if (selectedBoxIndex === null) return;
    
    setBoxes(prev => prev.map((box, boxIndex) => {
      if (boxIndex === selectedBoxIndex) {
        return {
          ...box,
          serviceOrders: box.serviceOrders.map((order, i) => 
            i === orderIndex ? { ...order, [field]: value } : order
          )
        };
      }
      return box;
    }));
  };

  const removeServiceOrder = (orderIndex: number) => {
    if (selectedBoxIndex === null) return;
    
    setBoxes(prev => prev.map((box, boxIndex) => {
      if (boxIndex === selectedBoxIndex) {
        return {
          ...box,
          serviceOrders: box.serviceOrders.filter((_, i) => i !== orderIndex)
        };
      }
      return box;
    }));
  };

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetModalState();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="glass-card border-border/30 text-white modal-dialog modal-content report-modal-content flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              {editMode ? "Editar Relatório" : "Novo Relatório"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => handleModalClose(false)}
              data-testid="button-close-report-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6 flex-1 overflow-y-auto pr-2 modal-scroll-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-muted-foreground mb-2">
                Nome do Relatório
              </Label>
              <Input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite o nome do relatório"
                data-testid="input-report-name"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-muted-foreground mb-2">
                Data
              </Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-report-date"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-muted-foreground mb-2">
                Turno
              </Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" data-testid="select-shift">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Números das Caixas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium text-white">
                Números das Caixas:
              </Label>
              <Button
                type="button"
                className="glass-button px-3 py-2 rounded-lg text-white text-sm"
                onClick={addBox}
                data-testid="button-add-box"
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar Caixa
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {boxes.map((box, index) => (
                <div key={index} className="relative">
                  {editingBoxIndex === index ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingBoxValue}
                        onChange={(e) => setEditingBoxValue(e.target.value)}
                        className="px-3 py-2 rounded-full border bg-secondary text-white border-border text-sm font-medium w-24 focus:outline-none focus:border-blue-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveBoxNumber(index);
                          } else if (e.key === 'Escape') {
                            setEditingBoxIndex(null);
                            setEditingBoxValue("");
                          }
                        }}
                        autoFocus
                        data-testid={`input-edit-box-${index}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveBoxNumber(index)}
                        className="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-green-600 ml-1"
                        data-testid={`button-save-box-${index}`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBoxIndex(null);
                          setEditingBoxValue("");
                        }}
                        className="w-6 h-6 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-600"
                        data-testid={`button-cancel-edit-box-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedBoxIndex(selectedBoxIndex === index ? null : index)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          selectedBoxIndex === index
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-secondary text-white border-border hover:border-blue-400'
                        }`}
                        data-testid={`button-box-${index}`}
                      >
                        {box.boxNumber}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditBoxNumber(index, box.boxNumber)}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600"
                        data-testid={`button-edit-box-${index}`}
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      {boxes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBox(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          data-testid={`button-remove-box-${index}`}
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
              
              {boxes.length === 0 && (
                <div className="text-center py-4 text-muted-foreground w-full">
                  Nenhuma caixa criada
                </div>
              )}
            </div>
          </div>

          {/* Seção de Técnicos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium text-white">
                Técnicos
              </Label>
            </div>

            {selectedBoxIndex !== null ? (
              <div className="space-y-3">
                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Técnicos para {boxes[selectedBoxIndex]?.boxNumber}:
                    </Label>
                    <Button
                      type="button"
                      className="glass-button px-3 py-1.5 rounded-lg text-white text-xs"
                      onClick={() => setTechnicianModalOpen(true)}
                      data-testid={`button-manage-technicians-${selectedBoxIndex}`}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      Gerenciar
                    </Button>
                  </div>
                  
                  {boxes[selectedBoxIndex]?.technicianIds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {boxes[selectedBoxIndex]?.technicianIds.map((technicianId) => {
                        const technician = technicians.find(t => t.id === technicianId);
                        if (!technician) return null;
                        
                        return (
                          <div 
                            key={technician.id} 
                            className="flex items-center justify-between p-2 rounded-lg bg-blue-500/20 border border-blue-500 text-white"
                          >
                            <span className="text-sm font-medium">{technician.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentTechnicians = boxes[selectedBoxIndex]?.technicianIds || [];
                                updateBoxTechnicians(selectedBoxIndex, currentTechnicians.filter(id => id !== technician.id));
                              }}
                              className="w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 ml-2"
                              data-testid={`button-remove-technician-${selectedBoxIndex}-${technician.id}`}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Nenhum técnico selecionado para esta caixa
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione uma caixa para gerenciar técnicos
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium text-white">
                Ordens de Serviço
                {selectedBoxIndex !== null && (
                  <span className="text-sm text-muted-foreground ml-2">
                    para {boxes[selectedBoxIndex]?.boxNumber}
                  </span>
                )}
              </Label>
              <Button
                type="button"
                className="glass-button px-3 py-2 rounded-lg text-white text-sm"
                onClick={addNewServiceOrder}
                data-testid="button-add-service-order"
                disabled={selectedBoxIndex === null}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar OS
              </Button>
            </div>
            
            {selectedBoxIndex !== null ? (
              <div className="space-y-3">
                {boxes[selectedBoxIndex]?.serviceOrders.map((order, index) => (
                <div key={index} className="glass-card p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Código OS
                      </Label>
                      <Input
                        type="text"
                        value={order.code}
                        onChange={(e) => updateServiceOrder(index, 'code', e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Ex: 123456"
                        data-testid={`input-order-code-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Tipo de Serviço
                      </Label>
                      <Select value={order.type} onValueChange={(value) => updateServiceOrder(index, 'type', value)}>
                        <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVAÇÃO">ATIVAÇÃO</SelectItem>
                          <SelectItem value="LOSS">LOSS</SelectItem>
                          <SelectItem value="UPGRADE">UPGRADE</SelectItem>
                          <SelectItem value="T.EQUIPAMENTO">T.EQUIPAMENTO</SelectItem>
                          <SelectItem value="SEM CONEXÃO">SEM CONEXÃO</SelectItem>
                          <SelectItem value="LENTIDÃO">LENTIDÃO</SelectItem>
                          <SelectItem value="CONFG. ROTEADOR">CONFG. ROTEADOR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Segunda linha com Cidade, Bairro e botão remover */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Cidade
                      </Label>
                      <Select 
                        value={order.cityId} 
                        onValueChange={(value) => {
                          updateServiceOrder(index, 'cityId', value);
                          updateServiceOrder(index, 'neighborhoodId', ''); // Reset neighborhood when city changes
                        }}
                      >
                        <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <SelectValue placeholder="Selecione cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.length === 0 ? (
                            <SelectItem value="no-cities" disabled>
                              Nenhuma cidade cadastrada
                            </SelectItem>
                          ) : (
                            cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3 text-blue-400" />
                                  <span>{city.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Bairro
                      </Label>
                      <NeighborhoodSelectForOrder 
                        cityId={order.cityId}
                        value={order.neighborhoodId}
                        onChange={(value) => updateServiceOrder(index, 'neighborhoodId', value)}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="glass-button p-2 text-white hover:text-red-400"
                        onClick={() => removeServiceOrder(index)}
                        data-testid={`button-remove-order-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block text-xs font-medium text-muted-foreground mb-1">
                      Alerta (opcional)
                    </Label>
                    <Textarea
                      value={order.alert}
                      onChange={(e) => updateServiceOrder(index, 'alert', e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm resize-none"
                      placeholder="Ex: Ligar 15 minutos antes, Não pode subir no telhado"
                      rows={2}
                      data-testid={`input-order-alert-${index}`}
                    />
                  </div>
                </div>
                ))}
                
                {boxes[selectedBoxIndex]?.serviceOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem de serviço adicionada para esta caixa
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione uma caixa para gerenciar ordens de serviço
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-6 pt-4 border-t border-border/30 flex-shrink-0">
          <Button
            className="flex-1 glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => handleModalClose(false)}
            data-testid="button-cancel-report"
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-lg text-white font-medium"
            onClick={generateReport}
            disabled={!reportName || !reportDate || !shift || boxes.filter(box => box.boxNumber.trim() !== "" && box.technicianIds.length > 0).length === 0 || createServiceOrderMutation.isPending}
            data-testid="button-generate-report"
          >
            {editMode ? "Atualizar Relatório" : "Gerar Relatório"}
          </Button>
        </div>
      </DialogContent>

      {/* Modal de Seleção de Técnicos */}
      <Dialog open={technicianModalOpen} onOpenChange={setTechnicianModalOpen}>
        <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Selecionar Técnicos para {selectedBoxIndex !== null ? boxes[selectedBoxIndex]?.boxNumber : ""}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {technicians.map((technician) => {
                const isSelected = selectedBoxIndex !== null && boxes[selectedBoxIndex]?.technicianIds.includes(technician.id);
                const isInOtherBox = boxes.some((otherBox, otherIndex) => 
                  otherIndex !== selectedBoxIndex && otherBox.technicianIds.includes(technician.id)
                );
                const isDisabled = isInOtherBox && !isSelected;
                
                return (
                  <label 
                    key={technician.id} 
                    className={`glass-card flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary/60 bg-primary/20 text-white shadow-lg shadow-primary/10' 
                        : isDisabled
                          ? 'border-border/20 bg-secondary/20 text-muted-foreground cursor-not-allowed opacity-50'
                          : 'border-border/30 hover:border-primary/40 text-white hover:bg-white/5 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (selectedBoxIndex === null) return;
                        const currentTechnicians = boxes[selectedBoxIndex]?.technicianIds || [];
                        if (e.target.checked) {
                          updateBoxTechnicians(selectedBoxIndex, [...currentTechnicians, technician.id]);
                        } else {
                          updateBoxTechnicians(selectedBoxIndex, currentTechnicians.filter(id => id !== technician.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-border/40 bg-secondary/50 text-primary focus:ring-primary/50 focus:ring-offset-0 disabled:cursor-not-allowed"
                      data-testid={`modal-checkbox-technician-${selectedBoxIndex}-${technician.id}`}
                    />
                    <Users className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">
                      {technician.name}
                      {isInOtherBox && !isSelected && (
                        <span className="ml-2 text-xs opacity-60 text-yellow-400">(em outra caixa)</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedBoxIndex !== null && boxes[selectedBoxIndex]?.technicianIds.length > 0 && (
              <div className="glass-card p-4 rounded-lg border border-border/30">
                <Label className="text-sm text-primary font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Técnicos Selecionados:
                </Label>
                <div className="text-sm text-white mt-2 flex flex-wrap gap-2">
                  {technicians
                    .filter(t => boxes[selectedBoxIndex]?.technicianIds.includes(t.id))
                    .map(t => (
                      <span key={t.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-md text-xs border border-primary/30">
                        <Users className="h-3 w-3 text-green-400" />
                        {t.name}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-border/20">
              <Button
                type="button"
                className="glass-button hover:bg-white/10 border border-border/30 px-6 py-2 rounded-lg text-white transition-all duration-200"
                onClick={() => setTechnicianModalOpen(false)}
                data-testid="button-close-technician-modal"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Componente auxiliar para seleção de bairros
function NeighborhoodSelectForOrder({ 
  cityId, 
  value, 
  onChange 
}: {
  cityId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: neighborhoods = [] } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods", "city", cityId],
    queryFn: () => cityId ? 
      fetch(`/api/neighborhoods/city/${cityId}`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!cityId
  });

  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={!cityId}
    >
      <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
        <SelectValue placeholder={cityId ? "Selecione bairro" : "Primeiro selecione cidade"} />
      </SelectTrigger>
      <SelectContent>
        {neighborhoods.length === 0 ? (
          <SelectItem value="no-neighborhoods" disabled>
            {cityId ? "Nenhum bairro cadastrado para esta cidade" : "Selecione uma cidade primeiro"}
          </SelectItem>
        ) : (
          neighborhoods.map((neighborhood) => (
            <SelectItem key={neighborhood.id} value={neighborhood.id}>
              <div className="flex items-center space-x-2">
                <Home className="h-3 w-3 text-green-400" />
                <span>{neighborhood.name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
