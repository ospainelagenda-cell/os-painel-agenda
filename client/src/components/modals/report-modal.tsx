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
import type { Team, ServiceOrder, City, Neighborhood } from "@shared/schema";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (content: string, name?: string, date?: string, shift?: string) => void;
}

interface NewServiceOrder {
  code: string;
  type: string;
  teamId: string;
  alert: string;
  cityId: string;
  neighborhoodId: string;
}

export default function ReportModal({ open, onOpenChange, onReportGenerated }: ReportModalProps) {
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [shift, setShift] = useState("");
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

  const createServiceOrderMutation = useMutation({
    mutationFn: async (order: NewServiceOrder) => {
      const response = await apiRequest("POST", "/api/service-orders", {
        code: order.code,
        type: order.type,
        teamId: order.teamId,
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

  const generateReport = async () => {
    if (!reportName || !reportDate || !shift) {
      return;
    }

    // Create new service orders first
    for (const order of newServiceOrders) {
      if (order.code && order.type && order.teamId) {
        try {
          await createServiceOrderMutation.mutateAsync(order);
        } catch (error) {
          console.error("Error creating service order:", error);
        }
      }
    }

    // Wait a moment for the queries to refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refetch service orders to include newly created ones
    await queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    const updatedServiceOrders = await queryClient.fetchQuery({ queryKey: ["/api/service-orders"] });

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };

    let content = `Serviços da Agenda: ${formatDate(reportDate)} - TURNO: ${shift.toUpperCase()}\n`;
    content += "-".repeat(57) + "\n";

    teams.forEach(team => {
      const teamOrders = (updatedServiceOrders as ServiceOrder[]).filter(order => 
        order.teamId === team.id && order.scheduledDate === reportDate
      );
      
      if (teamOrders.length > 0) {
        content += `${team.name}: (${team.boxNumber})\n`;
        teamOrders.forEach(order => {
          content += `- ${order.code} ${order.type}\n`;
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
                        Equipe
                      </Label>
                      <Select value={order.teamId} onValueChange={(value) => updateServiceOrder(index, 'teamId', value)}>
                        <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team.boxNumber})
                            </SelectItem>
                          ))}
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
            disabled={!reportName || !reportDate || !shift || createServiceOrderMutation.isPending}
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
