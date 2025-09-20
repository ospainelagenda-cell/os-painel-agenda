import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, MapPin, Home } from "lucide-react";
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
}

interface NewServiceOrder {
  code: string;
  type: string;
  teamId: string;
  technicianId: string;
  boxIndex: string; // Index da caixa selecionada (como string)
  alert: string;
  cityId: string;
  neighborhoodId: string;
}

interface BoxData {
  boxNumber: string;
  technicianIds: string[];
  teamId?: string;
}

export default function ReportModal({ open, onOpenChange, onReportGenerated }: ReportModalProps) {
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [shift, setShift] = useState("");
  const [boxes, setBoxes] = useState<BoxData[]>([{ boxNumber: "", technicianIds: [] }]);
  const [newServiceOrders, setNewServiceOrders] = useState<NewServiceOrder[]>([]);
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

  const createServiceOrderMutation = useMutation({
    mutationFn: async (order: NewServiceOrder) => {
      const response = await apiRequest("POST", "/api/service-orders", {
        code: order.code,
        type: order.type,
        teamId: order.teamId || null, // Permitir criação sem team por enquanto
        technicianId: order.technicianId || null, // Incluir técnico selecionado
        alert: order.alert || undefined,
        scheduledDate: reportDate,
        status: "Pendente"
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

  const addBox = () => {
    setBoxes(prev => [...prev, { boxNumber: "", technicianIds: [] }]);
  };

  const updateBoxNumber = (index: number, boxNumber: string) => {
    setBoxes(prev => prev.map((box, i) => i === index ? { ...box, boxNumber } : box));
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
    
    // Limpar service orders que referenciam técnicos removidos desta caixa
    setNewServiceOrders(prev => prev.map(order => {
      if (order.boxIndex === index.toString() && order.technicianId && !technicianIds.includes(order.technicianId)) {
        // Técnico foi removido da caixa - limpar seleção
        return { ...order, technicianId: "" };
      }
      return order;
    }));
  };

  const removeBox = (index: number) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
    
    // Limpar service orders que referenciam boxes removidos ou ajustar índices
    setNewServiceOrders(prev => prev.map(order => {
      if (order.boxIndex === "") return order; // Nenhuma caixa selecionada, manter como está
      
      const orderBoxIndex = Number(order.boxIndex);
      if (orderBoxIndex === index) {
        // Box removido - resetar seleção
        return { ...order, boxIndex: "", technicianId: "" };
      } else if (orderBoxIndex > index) {
        // Ajustar índice para box que mudou de posição
        return { ...order, boxIndex: (orderBoxIndex - 1).toString() };
      }
      return order; // Box não afetado
    }));
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

    // Create new service orders first
    for (const order of newServiceOrders) {
      if (order.code && order.type && order.technicianId) {
        // Validar integridade: verificar se box e técnico são válidos
        const boxIndex = Number(order.boxIndex);
        const selectedBox = boxIndex >= 0 && boxIndex < boxes.length ? boxes[boxIndex] : undefined;
        
        if (!selectedBox || !selectedBox.technicianIds.includes(order.technicianId)) {
          console.warn(`Skipping invalid service order: ${order.code} - box or technician invalid`);
          continue;
        }
        
        try {
          await createServiceOrderMutation.mutateAsync(order);
        } catch (error) {
          console.error("Error creating service order:", error);
        }
      }
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
    content += "-".repeat(57) + "\n";

    // Agrupar por Caixa → Técnicos → Service Orders
    validBoxes.forEach(box => {
      // Encontrar service orders para técnicos desta caixa na data especificada
      const boxOrders = (updatedServiceOrders as ServiceOrder[]).filter(order => 
        box.technicianIds.includes(order.technicianId) && 
        order.scheduledDate === reportDate
      );
      
      if (boxOrders.length > 0) {
        content += `CAIXA ${box.boxNumber}:\n`;
        
        // Agrupar ordens por técnico
        box.technicianIds.forEach(technicianId => {
          const technicianOrders = boxOrders.filter(order => order.technicianId === technicianId);
          
          if (technicianOrders.length > 0) {
            // Encontrar nome do técnico
            const technician = technicians.find(t => t.id === technicianId);
            const technicianName = technician ? technician.name : `Técnico ${technicianId}`;
            
            content += `  ${technicianName}:\n`;
            technicianOrders.forEach(order => {
              content += `    - ${order.code} ${order.type}\n`;
            });
          }
        });
        
        content += "-".repeat(57) + "\n";
      }
    });

    onReportGenerated(content, reportName, reportDate, shift);
    
    // Reset form
    setReportName("");
    setReportDate("");
    setShift("");
    setNewServiceOrders([]);
  };

  const getNeighborhoodsByCity = (cityId: string): Neighborhood[] => {
    if (!cityId) return [];
    // Since we need dynamic neighborhoods, we'll handle this in the component
    return [];
  };

  const addNewServiceOrder = () => {
    setNewServiceOrders(prev => [...prev, { 
      code: "", 
      type: "", 
      teamId: "", 
      technicianId: "",
      boxIndex: "", // "" significa nenhuma caixa selecionada
      alert: "", 
      cityId: "", 
      neighborhoodId: "" 
    }]);
  };

  const updateServiceOrder = (index: number, field: keyof NewServiceOrder, value: string) => {
    setNewServiceOrders(prev => 
      prev.map((order, i) => i === index ? { ...order, [field]: value } : order)
    );
  };

  const removeServiceOrder = (index: number) => {
    setNewServiceOrders(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white modal-dialog modal-content report-modal-content flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Novo Relatório
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
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

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium text-white">
                Números das Caixas
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
            
            <div className="space-y-3">
              {boxes.map((box, index) => (
                <div key={index} className="glass-card p-4 rounded-lg space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-1">
                          Número da Caixa
                        </Label>
                        <Input
                          type="text"
                          value={box.boxNumber}
                          onChange={(e) => updateBoxNumber(index, e.target.value)}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm"
                          placeholder="Ex: CAIXA-01"
                          data-testid={`input-box-number-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label className="block text-xs font-medium text-muted-foreground mb-2">
                          Técnicos Responsáveis
                        </Label>
                        <div className="space-y-2">
                          {technicians.map((technician) => {
                            const isSelected = box.technicianIds.includes(technician.id);
                            // Verificar se técnico já está em outra caixa
                            const isInOtherBox = boxes.some((otherBox, otherIndex) => 
                              otherIndex !== index && otherBox.technicianIds.includes(technician.id)
                            );
                            const isDisabled = isInOtherBox && !isSelected;
                            
                            return (
                              <label key={technician.id} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateBoxTechnicians(index, [...box.technicianIds, technician.id]);
                                    } else {
                                      updateBoxTechnicians(index, box.technicianIds.filter(id => id !== technician.id));
                                    }
                                  }}
                                  className="rounded bg-secondary border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed"
                                  data-testid={`checkbox-technician-${index}-${technician.id}`}
                                />
                                <span className={`text-sm ${isDisabled ? 'text-muted-foreground' : 'text-white'}`}>
                                  {technician.name}
                                  {isInOtherBox && !isSelected && (
                                    <span className="ml-1 text-xs text-muted-foreground">(em outra caixa)</span>
                                  )}
                                </span>
                              </label>
                            );
                          })}
                          {technicians.length === 0 && (
                            <div className="text-muted-foreground text-sm">
                              Nenhum técnico cadastrado
                            </div>
                          )}
                        </div>
                        
                        {box.technicianIds.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <Label className="text-xs text-muted-foreground">Técnicos selecionados:</Label>
                            <div className="text-sm text-primary">
                              {technicians
                                .filter(t => box.technicianIds.includes(t.id))
                                .map(t => t.name)
                                .join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {boxes.length > 1 && (
                      <div className="flex items-start pt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="glass-button p-2 text-white hover:text-red-400"
                          onClick={() => removeBox(index)}
                          data-testid={`button-remove-box-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {boxes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma caixa adicionada
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium text-white">
                Ordens de Serviço
              </Label>
              <Button
                type="button"
                className="glass-button px-3 py-2 rounded-lg text-white text-sm"
                onClick={addNewServiceOrder}
                data-testid="button-add-service-order"
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar OS
              </Button>
            </div>
            
            <div className="space-y-3">
              {newServiceOrders.map((order, index) => (
                <div key={index} className="glass-card p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Caixa
                      </Label>
                      <Select 
                        value={order.boxIndex} 
                        onValueChange={(value) => {
                          updateServiceOrder(index, 'boxIndex', value);
                          // Reset técnico quando mudar de caixa
                          updateServiceOrder(index, 'technicianId', "");
                        }}
                      >
                        <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <SelectValue placeholder="Selecione uma caixa" />
                        </SelectTrigger>
                        <SelectContent>
                          {boxes.map((box, originalIndex) => {
                            // Só renderizar boxes válidos, mas manter índices originais
                            if (box.boxNumber.trim() !== "" && box.technicianIds.length > 0) {
                              return (
                                <SelectItem key={originalIndex} value={originalIndex.toString()}>
                                  {box.boxNumber}
                                </SelectItem>
                              );
                            }
                            return null;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="block text-xs font-medium text-muted-foreground mb-1">
                        Técnico
                      </Label>
                      <Select 
                        value={order.technicianId} 
                        onValueChange={(value) => updateServiceOrder(index, 'technicianId', value)}
                        disabled={order.boxIndex === ""}
                      >
                        <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <SelectValue placeholder={order.boxIndex === "" ? "Primeiro selecione uma caixa" : "Selecione um técnico"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            if (order.boxIndex === "") {
                              return (
                                <SelectItem value="no-technicians" disabled>
                                  Selecione uma caixa primeiro
                                </SelectItem>
                              );
                            }
                            
                            const selectedBoxIndex = Number(order.boxIndex);
                            const selectedBox = selectedBoxIndex >= 0 && selectedBoxIndex < boxes.length ? boxes[selectedBoxIndex] : undefined;
                            
                            if (!selectedBox) {
                              return (
                                <SelectItem value="invalid-box" disabled>
                                  Caixa selecionada inválida
                                </SelectItem>
                              );
                            }
                            
                            return selectedBox.technicianIds.map((technicianId) => {
                              const technician = technicians.find(t => t.id === technicianId);
                              return technician ? (
                                <SelectItem key={technician.id} value={technician.id}>
                                  {technician.name}
                                </SelectItem>
                              ) : null;
                            });
                          })()}
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
              
              {newServiceOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem de serviço adicionada
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6 pt-4 border-t border-border/30 flex-shrink-0">
          <Button
            className="flex-1 glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => onOpenChange(false)}
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
            Gerar Relatório
          </Button>
        </div>
      </DialogContent>
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
