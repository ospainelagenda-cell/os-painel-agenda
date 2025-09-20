import { X, Calendar, Clock, User, Phone, MapPin, AlertTriangle, Users, CheckCircle, XCircle, RotateCcw, Sticker, Ban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceOrder, Team } from "@shared/schema";

interface DayServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

export default function DayServicesModal({ open, onOpenChange, selectedDate }: DayServicesModalProps) {
  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Sem equipe";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Equipe não encontrada";
  };

  const getDayServices = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return serviceOrders.filter(order => order.scheduledDate === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-500";
      case "Pendente":
        return "bg-yellow-500";
      case "Reagendado":
        return "bg-red-500";
      case "Adesivado":
        return "bg-blue-500";
      case "Cancelado":
        return "bg-gray-500";
      default:
        return "bg-purple-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído":
        return <CheckCircle className="h-4 w-4 text-white" />;
      case "Reagendado":
        return <RotateCcw className="h-4 w-4 text-white" />;
      case "Adesivado":
        return <Sticker className="h-4 w-4 text-white" />;
      case "Cancelado":
        return <Ban className="h-4 w-4 text-white" />;
      case "Pendente":
      default:
        return <XCircle className="h-4 w-4 text-white" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Concluído":
        return "default";
      case "Pendente":
        return "secondary";
      case "Reagendado":
        return "destructive";
      case "Adesivado":
        return "outline";
      case "Cancelado":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const dayServices = getDayServices();
  const statusCounts = {
    completed: dayServices.filter(s => s.status === "Concluído").length,
    pending: dayServices.filter(s => s.status === "Pendente").length,
    rescheduled: dayServices.filter(s => s.status === "Reagendado").length,
    adesivado: dayServices.filter(s => s.status === "Adesivado").length,
    cancelled: dayServices.filter(s => s.status === "Cancelado").length
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Serviços do Dia
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
          {selectedDate && (
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-primary">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Data:</span>
                  </div>
                  <p className="text-white mt-1 capitalize">{formatSelectedDate()}</p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-400">{statusCounts.completed}</div>
                    <div className="text-muted-foreground text-xs">Concluído</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-yellow-400">{statusCounts.pending}</div>
                    <div className="text-muted-foreground text-xs">Pendente</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-red-400">{statusCounts.rescheduled}</div>
                    <div className="text-muted-foreground text-xs">Reagendado</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dayServices.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum serviço agendado para este dia</p>
              <p className="text-muted-foreground text-sm mt-2">
                Clique em uma data para agendar novos serviços
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">
                {dayServices.length} {dayServices.length === 1 ? 'Serviço Agendado' : 'Serviços Agendados'}
              </h3>
              
              <div className="grid gap-4">
                {dayServices.map((service) => (
                  <div
                    key={service.id}
                    className="glass-card p-4 rounded-lg border border-border/30"
                    data-testid={`day-service-${service.code}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                        <span className="font-medium text-white">OS #{service.code}</span>
                        <Badge variant={getStatusBadgeVariant(service.status)} className="text-xs">
                          {service.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          {getStatusIcon(service.status)}
                          <span>{service.status}</span>
                        </Badge>
                      </div>
                      {service.scheduledTime && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{service.scheduledTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {service.customerName && (
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-white">{service.customerName}</span>
                          </div>
                        )}

                        {service.customerPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-white">{service.customerPhone}</span>
                          </div>
                        )}

                        {service.address && (
                          <div className="flex items-start space-x-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <span className="text-white">{service.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-primary">{getTeamName(service.teamId)}</span>
                        </div>

                        {service.description && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Descrição: </span>
                            <span className="text-white">{service.description}</span>
                          </div>
                        )}

                        {service.createdViaCalendar && (
                          <div className="text-xs text-primary">
                            ✓ Agendado via calendário
                          </div>
                        )}
                      </div>
                    </div>

                    {service.alert && (
                      <div className="mt-3 glass-card p-3 bg-yellow-500/10 border border-yellow-400/20 rounded">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div>
                            <span className="text-yellow-400 text-sm font-medium">Alerta:</span>
                            <p className="text-yellow-400 text-sm mt-1">{service.alert}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              className="glass-button text-white border-border"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-day-services"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}