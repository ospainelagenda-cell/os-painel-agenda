import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ArrowRightLeft, Calendar, CheckCircle, XCircle, RotateCcw, Sticker, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder, Technician } from "@shared/schema";

interface ReallocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export default function ReallocationModal({ open, onOpenChange, teamId }: ReallocationModalProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [targetTeamId, setTargetTeamId] = useState("");
  // Set today's date as default for filter
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
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
  const currentTeamOrders = serviceOrders.filter(order => {
    const matchesTeam = order.teamId === teamId;
    if (!filterDate) return matchesTeam;
    return matchesTeam && order.scheduledDate === filterDate;
  });
  const availableTeams = teams.filter(team => team.id !== teamId);

  const getTechnicianNames = (technicianIds: string[]) => {
    const names = technicianIds
      .map(id => technicians.find(tech => tech.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Nenhum técnico atribuído";
  };

  const reallocationMutation = useMutation({
    mutationFn: async (data: { serviceOrderIds: string[]; newTeamId: string }) => {
      const response = await apiRequest("POST", "/api/service-orders/reallocate", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      setSelectedOrders([]);
      setTargetTeamId("");
      onOpenChange(false);
      toast({ title: "Ordens de serviço realocadas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao realocar ordens de serviço", variant: "destructive" });
    }
  });

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => 
      checked 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? currentTeamOrders.map(order => order.id) : []);
  };

  const handleDateFilterChange = (date: string) => {
    setFilterDate(date);
    setSelectedOrders([]); // Clear selections when filter changes
  };

  const handleReallocate = () => {
    if (selectedOrders.length === 0 || !targetTeamId) return;

    reallocationMutation.mutate({
      serviceOrderIds: selectedOrders,
      newTeamId: targetTeamId
    });
  };

  if (!currentTeam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Realocar Ordens de Serviço
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-reallocation-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">
                  Equipe Atual: {getTechnicianNames(currentTeam.technicianIds)}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Selecione as ordens de serviço para realocar:
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Filtrar por data:
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="w-40 bg-secondary border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-reallocation-filter-date"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {filterDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-white"
                    onClick={() => handleDateFilterChange("")}
                    data-testid="button-clear-reallocation-filter"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {currentTeamOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {filterDate 
                    ? `Nenhuma ordem encontrada para ${new Date(filterDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                    : "Nenhuma ordem de serviço atribuída a esta equipe"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedOrders.length === currentTeamOrders.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm text-white cursor-pointer">
                    Selecionar todas ({currentTeamOrders.length} ordens)
                  </label>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {currentTeamOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center space-x-2 glass-card p-3 rounded-lg"
                      data-testid={`order-${order.code}`}
                    >
                      <Checkbox
                        id={order.id}
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleOrderSelection(order.id, checked as boolean)}
                      />
                      <label htmlFor={order.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-white">#{order.code} - {order.type}</span>
                          <div className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${
                            order.status === "Concluído" 
                              ? "bg-green-600 text-green-100"
                              : order.status === "Reagendado"
                              ? "bg-red-600 text-red-100"
                              : order.status === "Adesivado"
                              ? "bg-blue-600 text-blue-100"
                              : order.status === "Cancelado"
                              ? "bg-gray-600 text-gray-100"
                              : "bg-yellow-600 text-yellow-100"
                          }`}>
                            {order.status === 'Concluído' && <CheckCircle className="h-3 w-3" />}
                            {order.status === 'Pendente' && <XCircle className="h-3 w-3" />}
                            {order.status === 'Reagendado' && <RotateCcw className="h-3 w-3" />}
                            {order.status === 'Adesivado' && <Sticker className="h-3 w-3" />}
                            {order.status === 'Cancelado' && <Ban className="h-3 w-3" />}
                            <span>
                            {order.status}
                            </span>
                          </div>
                        </div>
                        {order.alert && (
                          <div className="text-xs text-yellow-400 mt-1">
                            ⚠ {order.alert}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Equipe de Destino
            </label>
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white" data-testid="select-target-team">
                <SelectValue placeholder="Selecione a equipe de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {getTechnicianNames(team.technicianIds)} ({team.boxNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            className="flex-1 glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-reallocation"
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-lg text-white font-medium"
            onClick={handleReallocate}
            disabled={selectedOrders.length === 0 || !targetTeamId || reallocationMutation.isPending}
            data-testid="button-confirm-reallocation"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {reallocationMutation.isPending ? "Realocando..." : "Realocar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
