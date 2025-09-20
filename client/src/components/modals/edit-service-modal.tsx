import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, X, Save, MapPin, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ServiceOrder, Team, City, Neighborhood } from "@shared/schema";

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrder: ServiceOrder | null;
}

export default function EditServiceModal({ open, onOpenChange, serviceOrder }: EditServiceModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    type: "",
    status: "",
    teamId: "",
    alert: "",
    description: "",
    customerName: "",
    customerPhone: "",
    address: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"]
  });

  const { data: neighborhoods = [] } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods", "city", selectedCityId],
    queryFn: () => selectedCityId ? 
      fetch(`/api/neighborhoods/city/${selectedCityId}`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!selectedCityId
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/service-orders/${serviceOrder?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "OS atualizada com sucesso!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar OS", variant: "destructive" });
    }
  });

  // Populate form when service order changes
  useEffect(() => {
    if (serviceOrder) {
      setFormData({
        code: serviceOrder.code || "",
        type: serviceOrder.type || "",
        status: serviceOrder.status || "",
        teamId: serviceOrder.teamId || "",
        alert: serviceOrder.alert || "",
        description: serviceOrder.description || "",
        customerName: serviceOrder.customerName || "",
        customerPhone: serviceOrder.customerPhone || "",
        address: serviceOrder.address || "",
        scheduledDate: serviceOrder.scheduledDate || "",
        scheduledTime: serviceOrder.scheduledTime || "",
      });
    }
  }, [serviceOrder]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!serviceOrder) return;
    
    updateServiceMutation.mutate(formData);
  };

  if (!serviceOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center">
            <Edit className="mr-2 h-5 w-5 text-primary" />
            Editar OS #{serviceOrder.code}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Código da OS *
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => updateFormData("code", e.target.value)}
                className="bg-secondary border border-border text-white"
                data-testid="input-edit-service-code"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Tipo de Serviço *
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateFormData("type", value)}>
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Reagendado">Reagendado</SelectItem>
                  <SelectItem value="Adesivado">Adesivado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Equipe
              </Label>
              <Select value={formData.teamId} onValueChange={(value) => updateFormData("teamId", value)}>
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} - {team.boxNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Data Agendada
              </Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => updateFormData("scheduledDate", e.target.value)}
                className="bg-secondary border border-border text-white"
                data-testid="input-edit-scheduled-date"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Horário
              </Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => updateFormData("scheduledTime", e.target.value)}
                className="bg-secondary border border-border text-white"
                data-testid="input-edit-scheduled-time"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Observações/Alerta
            </Label>
            <Textarea
              value={formData.alert}
              onChange={(e) => updateFormData("alert", e.target.value)}
              className="bg-secondary border border-border text-white"
              placeholder="Ex: Ligar 15 minutos antes, portão azul..."
              rows={3}
              data-testid="input-edit-alert"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Descrição Adicional
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="bg-secondary border border-border text-white"
              placeholder="Detalhes adicionais sobre o serviço"
              rows={2}
              data-testid="input-edit-description"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={updateServiceMutation.isPending}
              data-testid="button-save-service-order"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateServiceMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-button text-white border-border"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-edit-service"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}