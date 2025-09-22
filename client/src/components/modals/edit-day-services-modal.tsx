import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Trash2, Save, Edit3, CheckCircle, XCircle, RotateCcw, Sticker, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder, City, Neighborhood, Technician } from "@shared/schema";

interface EditDayServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onServicesUpdated: () => void;
}

export default function EditDayServicesModal({ 
  open, 
  onOpenChange, 
  selectedDate,
  onServicesUpdated 
}: EditDayServicesModalProps) {
  const [editingServices, setEditingServices] = useState<ServiceOrder[]>([]);
  const { toast } = useToast();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"]
  });

  const { data: neighborhoods = [] } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods"]
  });

  // Function to get technicians names for a team
  const getTeamTechnicians = (team: Team) => {
    const teamTechnicians = team.technicianIds
      .map(techId => technicians.find(tech => tech.id === techId))
      .filter((tech): tech is Technician => tech !== undefined)
      .map(tech => tech.name);
    
    return teamTechnicians.length > 0 ? teamTechnicians.join(', ') : 'Sem técnicos';
  };

  // Filter services for the selected date
  useEffect(() => {
    if (open && selectedDate) {
      const dayServices = serviceOrders.filter(order => 
        order.scheduledDate === selectedDate
      );
      setEditingServices([...dayServices]);
    }
  }, [open, selectedDate, serviceOrders]);

  const updateServiceMutation = useMutation({
    mutationFn: async (service: ServiceOrder) => {
      return apiRequest('PATCH', `/api/service-orders/${service.id}`, {
        code: service.code,
        type: service.type,
        teamId: service.teamId,
        status: service.status,
        alert: service.alert,
        scheduledDate: service.scheduledDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: async (service: Partial<ServiceOrder>) => {
      return apiRequest('POST', '/api/service-orders', {
        code: service.code,
        type: service.type,
        teamId: service.teamId,
        status: "Pendente",
        scheduledDate: selectedDate,
        alert: service.alert
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return apiRequest('DELETE', `/api/service-orders/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    }
  });

  const handleSaveAll = async () => {
    try {
      // Update existing services
      for (const service of editingServices) {
        if (service.id) {
          await updateServiceMutation.mutateAsync(service);
        }
      }
      
      toast({
        title: "Sucesso!",
        description: "Serviços atualizados com sucesso."
      });
      
      onServicesUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviços.",
        variant: "destructive"
      });
    }
  };

  const addNewService = () => {
    const newService: ServiceOrder = {
      id: `temp-${Date.now()}`,
      code: "",
      type: "",
      status: "Pendente",
      teamId: "",
      scheduledDate: selectedDate,
      alert: "",
      createdAt: new Date(),
      customerName: null,
      customerPhone: null,
      address: null,
      description: null,
      scheduledTime: null,
      reminderEnabled: true,
      createdViaCalendar: false
    };
    setEditingServices(prev => [...prev, newService]);
  };

  const updateService = (index: number, field: keyof ServiceOrder, value: string) => {
    setEditingServices(prev => 
      prev.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    );
  };

  const removeService = async (index: number) => {
    const service = editingServices[index];
    
    if (service.id && !service.id.startsWith('temp-')) {
      try {
        await deleteServiceMutation.mutateAsync(service.id);
        toast({
          title: "Sucesso!",
          description: "Serviço removido com sucesso."
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao remover serviço.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setEditingServices(prev => prev.filter((_, i) => i !== index));
  };

  // Helper functions for city and neighborhood management
  const getCityIdFromService = (service: ServiceOrder): string => {
    // For now, we'll store cityId in a custom field or derive from address
    return (service as any).cityId || "";
  };

  const getNeighborhoodIdFromService = (service: ServiceOrder): string => {
    // For now, we'll store neighborhoodId in a custom field
    return (service as any).neighborhoodId || "";
  };

  const getNeighborhoodsForCity = (cityId: string): Neighborhood[] => {
    if (!cityId) return [];
    return neighborhoods.filter(n => n.cityId === cityId);
  };

  const updateServiceCity = (index: number, cityId: string) => {
    setEditingServices(prev => 
      prev.map((service, i) => 
        i === index ? { 
          ...service, 
          cityId: cityId,
          neighborhoodId: "" // Clear neighborhood when city changes
        } as any : service
      )
    );
  };

  const updateServiceNeighborhood = (index: number, neighborhoodId: string) => {
    setEditingServices(prev => 
      prev.map((service, i) => 
        i === index ? { ...service, neighborhoodId } as any : service
      )
    );
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Equipe não encontrada";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <Edit3 className="mr-2 h-5 w-5" />
              Editar Serviços do Dia {formatDate(selectedDate)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-edit-services"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {editingServices.map((service, index) => (
            <div key={service.id || index} className="glass-card p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Código OS
                  </Label>
                  <Input
                    value={service.code}
                    onChange={(e) => updateService(index, 'code', e.target.value)}
                    placeholder="Ex: 123456"
                    className="glass-input"
                    data-testid={`input-code-${index}`}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tipo de Serviço
                  </Label>
                  <Select 
                    value={service.type || ""} 
                    onValueChange={(value) => updateService(index, 'type', value)}
                  >
                    <SelectTrigger className="glass-input" data-testid={`select-type-${index}`}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/30">
                      <SelectItem value="ATIVAÇÃO">ATIVAÇÃO</SelectItem>
                      <SelectItem value="MANUTENÇÃO">MANUTENÇÃO</SelectItem>
                      <SelectItem value="INSTALAÇÃO">INSTALAÇÃO</SelectItem>
                      <SelectItem value="REPARO">REPARO</SelectItem>
                      <SelectItem value="LOSS">LOSS</SelectItem>
                      <SelectItem value="UPGRADE">UPGRADE</SelectItem>
                      <SelectItem value="SEM CONEXÃO">SEM CONEXÃO</SelectItem>
                      <SelectItem value="T.EQUIPAMENTO">T.EQUIPAMENTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Equipe
                  </Label>
                  <Select 
                    value={service.teamId || ""} 
                    onValueChange={(value) => updateService(index, 'teamId', value)}
                  >
                    <SelectTrigger className="glass-input" data-testid={`select-team-${index}`}>
                      <SelectValue placeholder="Selecionar equipe" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/30">
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{team.name} (Caixa {team.boxNumber})</span>
                            <span className="text-xs text-muted-foreground">{getTeamTechnicians(team)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <Select 
                    value={service.status} 
                    onValueChange={(value) => updateService(index, 'status', value)}
                  >
                    <SelectTrigger className="glass-input" data-testid={`select-status-${index}`}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/30">
                      <SelectItem value="Pendente">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-yellow-400" />
                          <span>Pendente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Concluído">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Concluído</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Reagendado">
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="h-4 w-4 text-red-400" />
                          <span>Reagendado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Adesivado">
                        <div className="flex items-center space-x-2">
                          <Sticker className="h-4 w-4 text-blue-400" />
                          <span>Adesivado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Cancelado">
                        <div className="flex items-center space-x-2">
                          <Ban className="h-4 w-4 text-gray-400" />
                          <span>Cancelado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Cidade
                  </Label>
                  <Select 
                    value={getCityIdFromService(service)} 
                    onValueChange={(value) => updateServiceCity(index, value)}
                  >
                    <SelectTrigger className="glass-input" data-testid={`select-city-${index}`}>
                      <SelectValue placeholder="Selecionar cidade" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/30">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Bairro
                  </Label>
                  <Select 
                    value={getNeighborhoodIdFromService(service)}
                    onValueChange={(value) => updateServiceNeighborhood(index, value)}
                    disabled={!getCityIdFromService(service)}
                  >
                    <SelectTrigger className="glass-input" data-testid={`select-neighborhood-${index}`}>
                      <SelectValue placeholder="Selecionar bairro" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/30">
                      {getNeighborhoodsForCity(getCityIdFromService(service)).map((neighborhood) => (
                        <SelectItem key={neighborhood.id} value={neighborhood.id}>
                          {neighborhood.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Observações/Alertas
                </Label>
                <Input
                  value={service.alert || ""}
                  onChange={(e) => updateService(index, 'alert', e.target.value)}
                  placeholder="Ex: Ligar 15 minutos antes"
                  className="glass-input"
                  data-testid={`input-alert-${index}`}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => removeService(index)}
                  data-testid={`button-remove-service-${index}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ))}

          <Button
            className="w-full glass-button py-3 rounded-lg text-white font-medium"
            onClick={addNewService}
            data-testid="button-add-service"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo Serviço
          </Button>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            className="flex-1 glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg text-white font-medium"
            onClick={handleSaveAll}
            disabled={updateServiceMutation.isPending || createServiceMutation.isPending}
            data-testid="button-save-all"
          >
            {updateServiceMutation.isPending || createServiceMutation.isPending ? (
              "Salvando..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}