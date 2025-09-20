import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Ban, Sticker } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ServiceOrder } from "@shared/schema";

interface TeamServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string;
  teamName?: string;
}

export default function TeamServicesModal({ open, onOpenChange, teamId, teamName }: TeamServicesModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const updateServiceOrderMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/service-orders/${data.id}`, {
        status: data.status
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  });

  const getTeamServicesForDate = (teamId: string, date: string) => {
    return serviceOrders.filter(order => {
      const matchesTeam = order.teamId === teamId;
      const matchesDate = order.scheduledDate === date;
      return matchesTeam && matchesDate;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "Reagendado":
        return <RotateCcw className="h-4 w-4 text-red-400" />;
      case "Adesivado":
        return <Sticker className="h-4 w-4 text-blue-400" />;
      case "Cancelado":
        return <Ban className="h-4 w-4 text-gray-400" />;
      case "Pendente":
      default:
        return <XCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-500";
      case "Reagendado":
        return "bg-red-500";
      case "Adesivado":
        return "bg-blue-500";
      case "Cancelado":
        return "bg-gray-500";
      case "Pendente":
      default:
        return "bg-yellow-500";
    }
  };

  const handleStatusChange = (serviceId: string, newStatus: string) => {
    updateServiceOrderMutation.mutate({
      id: serviceId,
      status: newStatus
    });
  };

  if (!teamId) return null;

  const teamServices = getTeamServicesForDate(teamId, selectedDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Serviços da Equipe - {teamName}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-muted-foreground hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Seletor de Data */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Selecionar Data
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-secondary border border-border text-white"
              data-testid="input-team-services-date"
            />
          </div>

          {/* Lista de Serviços */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                Serviços do Dia ({teamServices.length})
              </h3>
              <span className="text-sm text-muted-foreground">
                {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {teamServices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  Nenhum serviço agendado para esta data.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamServices.map((service) => (
                  <div
                    key={service.id}
                    className="glass-card p-4 rounded-lg space-y-3"
                    data-testid={`team-service-${service.code}`}
                  >
                    {/* Cabeçalho do Serviço */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusClass(service.status)}`}></div>
                        <span className="font-medium text-white">#{service.code}</span>
                        <span className="text-sm text-muted-foreground">{service.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <Select 
                          value={service.status} 
                          onValueChange={(newStatus) => handleStatusChange(service.id, newStatus)}
                          disabled={updateServiceOrderMutation.isPending}
                        >
                          <SelectTrigger className="w-32 bg-secondary border border-border text-white h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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

                    {/* Detalhes do Serviço */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {service.scheduledTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Horário:</span>
                          <span className="text-white">{service.scheduledTime}</span>
                        </div>
                      )}
                      
                      {service.customerName && (
                        <div>
                          <span className="text-muted-foreground">Cliente:</span>
                          <span className="text-white ml-2">{service.customerName}</span>
                        </div>
                      )}
                      
                      {service.customerPhone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="text-white ml-2">{service.customerPhone}</span>
                        </div>
                      )}
                      
                      {service.address && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Endereço:</span>
                          <span className="text-white ml-2">{service.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Alertas e Observações */}
                    {(service.alert || service.description) && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        {service.alert && (
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                            <div>
                              <span className="text-yellow-400 font-medium text-sm">Alerta:</span>
                              <p className="text-white text-sm">{service.alert}</p>
                            </div>
                          </div>
                        )}
                        
                        {service.description && (
                          <div>
                            <span className="text-muted-foreground text-sm">Observações:</span>
                            <p className="text-white text-sm mt-1">{service.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}