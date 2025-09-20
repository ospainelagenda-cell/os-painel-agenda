import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Phone, Home, Wrench, Calendar, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceOrder, Team, Technician } from "@shared/schema";

export default function AlertsSection() {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [deleteAlertModalOpen, setDeleteAlertModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });

  const alertOrders = serviceOrders.filter(order => {
    const hasAlert = order.alert;
    const isPending = order.status === "Pendente";
    if (!hasAlert || !isPending) return false;
    if (!selectedDate) return true;
    return order.scheduledDate === selectedDate;
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "";
  };

  const getAlertIcon = (alert: string) => {
    if (alert.toLowerCase().includes("ligar")) return Phone;
    if (alert.toLowerCase().includes("telhado")) return Home;
    return Wrench;
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Código copiado!",
        description: `Código ${code} copiado para a área de transferência.`
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive"
      });
    }
  };

  const deleteAlertMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await apiRequest("PUT", `/api/service-orders/${orderId}`, {
        alert: "",
        description: reason
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({
        title: "Alerta excluído!",
        description: "O alerta foi removido com sucesso."
      });
      setDeleteAlertModalOpen(false);
      setDeleteReason("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir alerta",
        description: "Não foi possível remover o alerta.",
        variant: "destructive"
      });
    }
  });

  const handleDeleteAlert = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setDeleteAlertModalOpen(true);
  };

  const confirmDeleteAlert = () => {
    if (!selectedOrder || !deleteReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da exclusão do alerta.",
        variant: "destructive"
      });
      return;
    }

    deleteAlertMutation.mutate({
      orderId: selectedOrder.id,
      reason: `Alerta excluído: ${deleteReason.trim()}`
    });
  };

  if (alertOrders.length === 0) {
    return (
      <div className="mb-6">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="text-amber-400 mr-2" />
            Ordens em Alerta
          </h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {selectedDate 
                ? `Nenhuma ordem com alerta para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : "Nenhuma ordem com alerta no momento"
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <AlertTriangle className="text-amber-400 mr-2" />
            Ordens em Alerta
          </h2>
          
          <div className="flex items-center space-x-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Filtrar por data:
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 bg-blue-950/50 border border-blue-400/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                data-testid="input-alerts-filter-date"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-blue-400 pointer-events-none" />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-white"
                onClick={() => setSelectedDate("")}
                data-testid="button-clear-alerts-filter"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertOrders.map((order) => {
            const IconComponent = getAlertIcon(order.alert || "");
            return (
              <div
                key={order.id}
                className="alert-badge p-4 rounded-lg font-medium text-sm"
                data-testid={`alert-${order.code}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">OS #{order.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 text-blue-300 hover:text-white"
                      onClick={() => handleCopyCode(order.code)}
                      data-testid={`button-copy-code-${order.code}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 text-blue-300 hover:text-red-400"
                      onClick={() => handleDeleteAlert(order)}
                      data-testid={`button-delete-alert-${order.code}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <IconComponent className="h-4 w-4" />
                  </div>
                </div>
                <p className="mb-1">{order.alert}</p>
                <span className="text-xs opacity-75">
                  {getTeamName(order.teamId)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para excluir alerta */}
      <Dialog open={deleteAlertModalOpen} onOpenChange={setDeleteAlertModalOpen}>
        <DialogContent className="glass-card border-border/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white flex items-center">
              <Trash2 className="mr-2 h-5 w-5 text-amber-400" />
              Excluir Alerta
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedOrder && (
              <div className="glass-card p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">OS #{selectedOrder.code}</p>
                <p className="text-sm text-white">{selectedOrder.alert}</p>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Motivo da exclusão do alerta *
              </Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex: Ligação realizada, cliente confirmou horrio..."
                className="bg-blue-950/50 border border-blue-400/30 text-white focus:ring-2 focus:ring-blue-400"
                rows={3}
                data-testid="textarea-delete-reason"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={confirmDeleteAlert}
                disabled={deleteAlertMutation.isPending}
                data-testid="button-confirm-delete-alert"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAlertMutation.isPending ? "Excluindo..." : "Excluir Alerta"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 glass-button text-white border-blue-400/30"
                onClick={() => setDeleteAlertModalOpen(false)}
                data-testid="button-cancel-delete-alert"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
