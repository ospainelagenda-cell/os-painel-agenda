import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, AlertTriangle, ArrowRightLeft, User, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, ServiceOrder, Technician } from "@shared/schema";

interface TechnicianServicesReallocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianId: string;
  technicianName: string;
  serviceOrders: ServiceOrder[];
  onCompleteReallocation?: () => void;
}

export default function TechnicianServicesReallocationModal({ 
  open, 
  onOpenChange, 
  technicianId,
  technicianName,
  serviceOrders,
  onCompleteReallocation
}: TechnicianServicesReallocationModalProps) {
  const [orderAssignments, setOrderAssignments] = useState<Record<string, string>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>(serviceOrders.map(order => order.id));

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const getTechnicianNames = (technicianIds: string[]) => {
    const names = technicianIds
      .map(id => technicians.find(tech => tech.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Nenhum técnico atribuído";
  };

  const getStatusClass = (status: string) => {
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
        return "bg-gray-500";
    }
  };

  const reallocationMutation = useMutation({
    mutationFn: async (data: { serviceOrderIds: string[]; newTeamId: string }[]) => {
      const promises = data.map(async (assignment) => {
        const response = await apiRequest("POST", "/api/service-orders/reallocate", {
          serviceOrderIds: assignment.serviceOrderIds,
          newTeamId: assignment.newTeamId
        });
        return await response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "Ordens de serviço realocadas com sucesso!" });
      onCompleteReallocation?.();
      onOpenChange(false);
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
    setSelectedOrders(checked ? serviceOrders.map(order => order.id) : []);
  };

  const handleTeamAssignment = (orderId: string, teamId: string) => {
    setOrderAssignments(prev => ({
      ...prev,
      [orderId]: teamId
    }));
  };

  const handleReallocate = () => {
    const selectedOrdersToReallocate = selectedOrders.filter(orderId => orderAssignments[orderId]);
    
    if (selectedOrdersToReallocate.length === 0) {
      toast({ 
        title: "Erro", 
        description: "Selecione pelo menos uma OS e atribua uma equipe de destino",
        variant: "destructive" 
      });
      return;
    }

    // Agrupa as ordens por equipe de destino
    const assignmentsByTeam = selectedOrdersToReallocate.reduce((acc, orderId) => {
      const teamId = orderAssignments[orderId];
      if (!acc[teamId]) {
        acc[teamId] = [];
      }
      acc[teamId].push(orderId);
      return acc;
    }, {} as Record<string, string[]>);

    // Converte para o formato esperado pela mutação
    const reallocationData = Object.entries(assignmentsByTeam).map(([teamId, orderIds]) => ({
      serviceOrderIds: orderIds,
      newTeamId: teamId
    }));

    reallocationMutation.mutate(reallocationData);
  };

  const canReallocate = selectedOrders.length > 0 && 
    selectedOrders.every(orderId => orderAssignments[orderId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-400" />
              Realocar Serviços do Técnico
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-100">
              O técnico <strong>{technicianName}</strong> possui {serviceOrders.length} ordem(ns) de serviço ativa(s).
              Selecione para quais equipes deseja realocar os serviços antes de remover/mover o técnico.
            </AlertDescription>
          </Alert>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Ordens de Serviço Ativas</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-orders"
                  checked={selectedOrders.length === serviceOrders.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all-orders" className="text-sm text-white cursor-pointer">
                  Selecionar todas ({serviceOrders.length} ordens)
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {serviceOrders.map((order) => (
                <div
                  key={order.id}
                  className="glass-card p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={order.id}
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleOrderSelection(order.id, checked as boolean)}
                      />
                      <div>
                        <span className="text-white font-medium">#{order.code} - {order.type}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusClass(order.status)}`}></div>
                          <span className="text-xs text-muted-foreground">{order.status}</span>
                          {order.alert && (
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400">
                              ⚠ {order.alert}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrders.includes(order.id) && (
                    <div className="pl-6">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Equipe de Destino:
                      </label>
                      <Select 
                        value={orderAssignments[order.id] || ""} 
                        onValueChange={(value) => handleTeamAssignment(order.id, value)}
                      >
                        <SelectTrigger className="bg-secondary border border-border text-white">
                          <SelectValue placeholder="Selecione a equipe de destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {getTechnicianNames(team.technicianIds)} - {team.boxNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            className="flex-1 glass-button text-white border-border"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={handleReallocate}
            disabled={!canReallocate || reallocationMutation.isPending}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {reallocationMutation.isPending ? "Realocando..." : "Realocar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}