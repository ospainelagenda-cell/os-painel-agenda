import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Clock, AlertTriangle, MapPin, Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, City, Neighborhood, Technician } from "@shared/schema";
import { z } from "zod";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string;
}

const addServiceOrderSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.string().default("Pendente"),
  teamId: z.string().optional(),
  alert: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  createdViaCalendar: z.boolean().optional()
});

type AddServiceOrderInput = z.infer<typeof addServiceOrderSchema>;

export default function AddServiceModal({ open, onOpenChange, teamId }: AddServiceModalProps) {
  const [formData, setFormData] = useState<Partial<AddServiceOrderInput>>({
    code: "",
    type: "",
    status: "Pendente",
    customerName: "",
    customerPhone: "",
    address: "",
    scheduledDate: new Date().toISOString().split('T')[0], // Data atual
    scheduledTime: "",
    alert: "",
    description: "",
    teamId: teamId || "",
    reminderEnabled: false,
    createdViaCalendar: false
  });

  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
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

  const selectedTeam = teams.find(team => team.id === teamId);

  const getTechnicianNames = (technicianIds: string[]) => {
    const names = technicianIds
      .map(id => technicians.find(tech => tech.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Nenhum técnico atribuído";
  };

  const createServiceOrderMutation = useMutation({
    mutationFn: async (data: AddServiceOrderInput) => {
      const response = await apiRequest("POST", "/api/service-orders", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "OS adicionada com sucesso!" });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao adicionar OS", variant: "destructive" });
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
      scheduledDate: new Date().toISOString().split('T')[0], // Data atual
      scheduledTime: "",
      alert: "",
      description: "",
      teamId: teamId || "",
      reminderEnabled: false,
      createdViaCalendar: false
    });
    setSelectedCityId("");
    setSelectedNeighborhoodId("");
  };

  const handleSubmit = () => {
    try {
      const validatedData = addServiceOrderSchema.parse({
        ...formData,
        teamId: teamId // Garantir que o teamId seja usado
      });
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

  const updateFormData = (field: keyof AddServiceOrderInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center">
            <Plus className="mr-2 h-5 w-5 text-primary" />
            Adicionar OS para Equipe
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
          {selectedTeam && (
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-primary">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Adicionando OS para:</span>
              </div>
              <p className="text-white mt-1">{getTechnicianNames(selectedTeam.technicianIds)} - {selectedTeam.boxNumber}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Código da OS *
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
                Tipo de Serviço *
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
                  <SelectItem value="UPGRADE">UPGRADE</SelectItem>
                  <SelectItem value="SEM CONEXÃO">SEM CONEXÃO</SelectItem>
                  <SelectItem value="T.EQUIPAMENTO">T.EQUIPAMENTO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos de Cidade e Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Cidade
              </Label>
              <Select 
                value={selectedCityId} 
                onValueChange={(value) => {
                  setSelectedCityId(value);
                  setSelectedNeighborhoodId("");
                }}
              >
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder="Selecione a cidade..." />
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
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span>{city.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Bairro
              </Label>
              <Select 
                value={selectedNeighborhoodId} 
                onValueChange={setSelectedNeighborhoodId}
                disabled={!selectedCityId}
              >
                <SelectTrigger className="bg-secondary border border-border text-white">
                  <SelectValue placeholder={selectedCityId ? "Selecione o bairro..." : "Primeiro selecione uma cidade"} />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.length === 0 ? (
                    <SelectItem value="no-neighborhoods" disabled>
                      {selectedCityId ? "Nenhum bairro cadastrado para esta cidade" : "Selecione uma cidade primeiro"}
                    </SelectItem>
                  ) : (
                    neighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        <div className="flex items-center space-x-2">
                          <Home className="h-4 w-4 text-green-400" />
                          <span>{neighborhood.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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

          <div className="flex space-x-3 pt-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={createServiceOrderMutation.isPending}
              data-testid="button-add-service-order"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createServiceOrderMutation.isPending ? "Adicionando..." : "Adicionar OS"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-button text-white border-border"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-add-service"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}