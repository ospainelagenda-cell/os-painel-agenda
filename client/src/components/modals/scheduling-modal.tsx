import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "@shared/schema";
import { z } from "zod";

interface SchedulingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

const scheduleServiceOrderSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.string().default("Pendente"),
  teamId: z.string().optional(),
  alert: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().min(1, "Horário é obrigatório"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  createdViaCalendar: z.boolean().optional()
});

type ScheduleServiceOrderInput = z.infer<typeof scheduleServiceOrderSchema>;

export default function SchedulingModal({ open, onOpenChange, selectedDate }: SchedulingModalProps) {
  const [formData, setFormData] = useState<Partial<ScheduleServiceOrderInput>>({
    code: "",
    type: "",
    status: "Pendente",
    customerName: "",
    customerPhone: "",
    address: "",
    scheduledDate: selectedDate?.toISOString().split('T')[0] || "",
    scheduledTime: "",
    alert: "",
    description: "",
    teamId: "",
    reminderEnabled: true,
    createdViaCalendar: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const createServiceOrderMutation = useMutation({
    mutationFn: async (data: ScheduleServiceOrderInput) => {
      const response = await apiRequest("POST", "/api/service-orders", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "Serviço agendado com sucesso!" });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao agendar serviço", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      code: "",
      type: "",
      status: "Pendente",
      customerName: "",
      customerPhone: "",
      address: "",
      scheduledDate: selectedDate?.toISOString().split('T')[0] || "",
      scheduledTime: "",
      alert: "",
      description: "",
      teamId: "",
      reminderEnabled: true,
      createdViaCalendar: true
    });
  };

  const handleSubmit = () => {
    try {
      const validatedData = scheduleServiceOrderSchema.parse(formData);
      createServiceOrderMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({ 
          title: "Erro de validação", 
          description: firstError.message,
          variant: "destructive" 
        });
      }
    }
  };

  const updateFormData = (field: keyof ScheduleServiceOrderInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Agendar Serviço
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
              <div className="flex items-center space-x-2 text-primary">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Data selecionada:</span>
              </div>
              <p className="text-white mt-1 capitalize">{formatSelectedDate()}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Código da OS
              </Label>
              <Input
                value={formData.code || ""}
                onChange={(e) => updateFormData("code", e.target.value)}
                className="bg-secondary border border-border text-white"
                placeholder="Ex: 139390"
                data-testid="input-service-code"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Tipo de Serviço
              </Label>
              <Select value={formData.type || ""} onValueChange={(value) => updateFormData("type", value)}>
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVAÇÃO">ATIVAÇÃO</SelectItem>
                  <SelectItem value="MANUTENÇÃO">MANUTENÇÃO</SelectItem>
                  <SelectItem value="INSTALAÇÃO">INSTALAÇÃO</SelectItem>
                  <SelectItem value="REPARO">REPARO</SelectItem>
                  <SelectItem value="LOSS">LOSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Data do Agendamento
              </Label>
              <Input
                type="date"
                value={formData.scheduledDate || ""}
                onChange={(e) => updateFormData("scheduledDate", e.target.value)}
                className="bg-secondary border border-border text-white"
                data-testid="input-scheduled-date"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Horário
              </Label>
              <Input
                type="time"
                value={formData.scheduledTime || ""}
                onChange={(e) => updateFormData("scheduledTime", e.target.value)}
                className="bg-secondary border border-border text-white"
                data-testid="input-scheduled-time"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Equipe Responsável
            </Label>
            <Select value={formData.teamId || ""} onValueChange={(value) => updateFormData("teamId", value)}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Nome do Cliente
              </Label>
              <Input
                value={formData.customerName || ""}
                onChange={(e) => updateFormData("customerName", e.target.value)}
                className="bg-secondary border border-border text-white"
                placeholder="Nome completo"
                data-testid="input-customer-name"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Telefone do Cliente
              </Label>
              <Input
                value={formData.customerPhone || ""}
                onChange={(e) => updateFormData("customerPhone", e.target.value)}
                className="bg-secondary border border-border text-white"
                placeholder="(11) 99999-9999"
                data-testid="input-customer-phone"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Endereço Completo
            </Label>
            <Textarea
              value={formData.address || ""}
              onChange={(e) => updateFormData("address", e.target.value)}
              className="bg-secondary border border-border text-white"
              placeholder="Rua, número, bairro, cidade, CEP"
              rows={3}
              data-testid="input-address"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Observações/Alerta
            </Label>
            <Textarea
              value={formData.alert || ""}
              onChange={(e) => updateFormData("alert", e.target.value)}
              className="bg-secondary border border-border text-white"
              placeholder="Ex: Ligar 15 minutos antes, portão azul..."
              rows={2}
              data-testid="input-alert"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Descrição Adicional
            </Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="bg-secondary border border-border text-white"
              placeholder="Detalhes adicionais sobre o serviço"
              rows={2}
              data-testid="input-description"
            />
          </div>

          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="reminder-enabled"
                checked={formData.reminderEnabled || false}
                onCheckedChange={(checked) => updateFormData("reminderEnabled", checked)}
              />
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <Label htmlFor="reminder-enabled" className="text-white cursor-pointer">
                  Enviar lembrete 1 dia antes do agendamento
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-6">
              O sistema enviará um alerta automático no dia anterior ao serviço agendado
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={createServiceOrderMutation.isPending}
              data-testid="button-schedule-service"
            >
              <Clock className="mr-2 h-4 w-4" />
              {createServiceOrderMutation.isPending ? "Agendando..." : "Agendar Serviço"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-button text-white border-border"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-schedule"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}