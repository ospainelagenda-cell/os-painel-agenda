import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Download, Upload, Settings, Plus, Trash2, Edit, Check, MapPin, Home, Lock, Key, Shield, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { City, Neighborhood, ServiceType, Technician } from "@shared/schema";

interface ConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConfigModal({ open, onOpenChange }: ConfigModalProps) {
  
  // Cities state
  const [newCityName, setNewCityName] = useState("");
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  // Neighborhoods state
  const [selectedCityForNeighborhoods, setSelectedCityForNeighborhoods] = useState<string>("");
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [neighborhoodListImport, setNeighborhoodListImport] = useState("");
  
  // Service Types state
  const [newServiceTypeName, setNewServiceTypeName] = useState("");
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  
  // Technicians state
  const [newTechnicianName, setNewTechnicianName] = useState("");
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"]
  });

  const { data: neighborhoods = [] } = useQuery<Neighborhood[]>({
    queryKey: ["/api/neighborhoods", "city", selectedCityForNeighborhoods],
    queryFn: () => selectedCityForNeighborhoods ? 
      fetch(`/api/neighborhoods/city/${selectedCityForNeighborhoods}`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!selectedCityForNeighborhoods
  });

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"]
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"]
  });




  // Cities mutations
  const createCityMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/cities", {
        name: data.name
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      setNewCityName("");
      toast({ title: "Cidade adicionada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar cidade", variant: "destructive" });
    }
  });

  const updateCityMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await apiRequest("PUT", `/api/cities/${data.id}`, {
        name: data.name
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      setEditingCity(null);
      toast({ title: "Cidade atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar cidade", variant: "destructive" });
    }
  });

  const deleteCitiesMutation = useMutation({
    mutationFn: async (cityIds: string[]) => {
      const promises = cityIds.map(id => apiRequest("DELETE", `/api/cities/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      setSelectedCities([]);
      toast({ title: "Cidades removidas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover cidades", variant: "destructive" });
    }
  });

  // Neighborhoods mutations
  const createNeighborhoodMutation = useMutation({
    mutationFn: async (data: { name: string; cityId: string }) => {
      const response = await apiRequest("POST", "/api/neighborhoods", {
        name: data.name,
        cityId: data.cityId
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      setNewNeighborhoodName("");
      toast({ title: "Bairro adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar bairro", variant: "destructive" });
    }
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; cityId: string }) => {
      const response = await apiRequest("PUT", `/api/neighborhoods/${data.id}`, {
        name: data.name,
        cityId: data.cityId
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      setEditingNeighborhood(null);
      toast({ title: "Bairro atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar bairro", variant: "destructive" });
    }
  });

  const deleteNeighborhoodsMutation = useMutation({
    mutationFn: async (neighborhoodIds: string[]) => {
      const promises = neighborhoodIds.map(id => apiRequest("DELETE", `/api/neighborhoods/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      setSelectedNeighborhoods([]);
      toast({ title: "Bairros removidos com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover bairros", variant: "destructive" });
    }
  });

  // Service Types mutations
  const createServiceTypeMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/service-types", {
        name: data.name
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-types"] });
      setNewServiceTypeName("");
      toast({ title: "Tipo de serviço adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar tipo de serviço", variant: "destructive" });
    }
  });

  const updateServiceTypeMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await apiRequest("PUT", `/api/service-types/${data.id}`, {
        name: data.name
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-types"] });
      setEditingServiceType(null);
      toast({ title: "Tipo de serviço atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tipo de serviço", variant: "destructive" });
    }
  });

  const deleteServiceTypesMutation = useMutation({
    mutationFn: async (serviceTypeIds: string[]) => {
      const promises = serviceTypeIds.map(id => apiRequest("DELETE", `/api/service-types/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-types"] });
      setSelectedServiceTypes([]);
      toast({ title: "Tipos de serviço removidos com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover tipos de serviço", variant: "destructive" });
    }
  });

  // Technicians mutations
  const createTechnicianMutation = useMutation({
    mutationFn: async (data: { name: string; cities: string[]; neighborhoods: string[] }) => {
      const response = await apiRequest("POST", "/api/technicians", {
        name: data.name,
        cities: data.cities,
        neighborhoods: data.neighborhoods
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setNewTechnicianName("");
      toast({ title: "Técnico adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar técnico", variant: "destructive" });
    }
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; cities: string[]; neighborhoods: string[] }) => {
      const response = await apiRequest("PUT", `/api/technicians/${data.id}`, {
        name: data.name,
        cities: data.cities,
        neighborhoods: data.neighborhoods
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setEditingTechnician(null);
      toast({ title: "Técnico atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar técnico", variant: "destructive" });
    }
  });

  const deleteTechniciansMutation = useMutation({
    mutationFn: async (technicianIds: string[]) => {
      const promises = technicianIds.map(id => apiRequest("DELETE", `/api/technicians/${id}`));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setSelectedTechnicians([]);
      toast({ title: "Técnicos removidos com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover técnicos", variant: "destructive" });
    }
  });


  // Cities handlers
  const handleAddCity = () => {
    if (!newCityName.trim()) return;
    createCityMutation.mutate({ name: newCityName.trim() });
  };

  const handleUpdateCity = () => {
    if (!editingCity || !editingCity.name.trim()) return;
    updateCityMutation.mutate({ id: editingCity.id, name: editingCity.name });
  };

  const handleCitySelection = (cityId: string, checked: boolean) => {
    setSelectedCities(prev => 
      checked 
        ? [...prev, cityId]
        : prev.filter(id => id !== cityId)
    );
  };

  const handleSelectAllCities = (checked: boolean) => {
    setSelectedCities(checked ? cities.map(city => city.id) : []);
  };

  const handleDeleteSelectedCities = () => {
    if (selectedCities.length === 0) return;
    deleteCitiesMutation.mutate(selectedCities);
  };

  // Neighborhoods handlers
  const handleAddNeighborhood = () => {
    if (!newNeighborhoodName.trim() || !selectedCityForNeighborhoods) return;
    createNeighborhoodMutation.mutate({ 
      name: newNeighborhoodName.trim(), 
      cityId: selectedCityForNeighborhoods 
    });
  };

  const handleUpdateNeighborhood = () => {
    if (!editingNeighborhood || !editingNeighborhood.name.trim()) return;
    updateNeighborhoodMutation.mutate({ 
      id: editingNeighborhood.id, 
      name: editingNeighborhood.name,
      cityId: editingNeighborhood.cityId
    });
  };

  const handleNeighborhoodSelection = (neighborhoodId: string, checked: boolean) => {
    setSelectedNeighborhoods(prev => 
      checked 
        ? [...prev, neighborhoodId]
        : prev.filter(id => id !== neighborhoodId)
    );
  };

  const handleSelectAllNeighborhoods = (checked: boolean) => {
    setSelectedNeighborhoods(checked ? neighborhoods.map(n => n.id) : []);
  };

  const handleDeleteSelectedNeighborhoods = () => {
    if (selectedNeighborhoods.length === 0) return;
    deleteNeighborhoodsMutation.mutate(selectedNeighborhoods);
  };

  // Bulk import neighborhoods from comma-separated list
  const bulkImportNeighborhoodsMutation = useMutation({
    mutationFn: async (neighborhoods: { name: string; cityId: string }[]) => {
      const promises = neighborhoods.map(neighborhood => 
        apiRequest("POST", "/api/neighborhoods", neighborhood)
          .then(response => response.json())
      );
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods"] });
      setNeighborhoodListImport("");
      toast({ 
        title: `${results.length} bairros importados com sucesso!`,
        description: "Lista de bairros adicionada à cidade selecionada."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao importar bairros", 
        description: error.message || "Alguns bairros podem não ter sido importados.",
        variant: "destructive" 
      });
    }
  });

  const handleImportNeighborhoodsList = () => {
    if (!neighborhoodListImport.trim() || !selectedCityForNeighborhoods) return;
    
    // Split by comma, clean up each name, and filter out empty ones
    const neighborhoodNames = neighborhoodListImport
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
    
    if (neighborhoodNames.length === 0) {
      toast({ 
        title: "Lista vazia", 
        description: "Por favor, insira uma lista de bairros separados por vírgula.",
        variant: "destructive" 
      });
      return;
    }

    // Check for existing neighborhoods to avoid duplicates
    const existingNames = neighborhoods.map(n => n.name.toLowerCase());
    const newNeighborhoods = neighborhoodNames
      .filter(name => !existingNames.includes(name.toLowerCase()))
      .map(name => ({
        name: name,
        cityId: selectedCityForNeighborhoods
      }));

    if (newNeighborhoods.length === 0) {
      toast({ 
        title: "Nenhum bairro novo", 
        description: "Todos os bairros da lista já estão cadastrados.",
        variant: "destructive" 
      });
      return;
    }

    const skipped = neighborhoodNames.length - newNeighborhoods.length;
    if (skipped > 0) {
      toast({ 
        title: `${skipped} bairros já existem`, 
        description: `${newNeighborhoods.length} novos bairros serão importados.`
      });
    }

    bulkImportNeighborhoodsMutation.mutate(newNeighborhoods);
  };

  // Service Types handlers
  const handleAddServiceType = () => {
    if (!newServiceTypeName.trim()) return;
    createServiceTypeMutation.mutate({ name: newServiceTypeName.trim() });
  };

  const handleUpdateServiceType = () => {
    if (!editingServiceType || !editingServiceType.name.trim()) return;
    updateServiceTypeMutation.mutate({ id: editingServiceType.id, name: editingServiceType.name });
  };

  const handleServiceTypeSelection = (serviceTypeId: string, checked: boolean) => {
    setSelectedServiceTypes(prev => 
      checked 
        ? [...prev, serviceTypeId]
        : prev.filter(id => id !== serviceTypeId)
    );
  };

  const handleSelectAllServiceTypes = (checked: boolean) => {
    setSelectedServiceTypes(checked ? serviceTypes.map(type => type.id) : []);
  };

  const handleDeleteSelectedServiceTypes = () => {
    if (selectedServiceTypes.length === 0) return;
    deleteServiceTypesMutation.mutate(selectedServiceTypes);
  };

  // Technicians handlers
  const handleAddTechnician = () => {
    if (!newTechnicianName.trim()) return;
    createTechnicianMutation.mutate({ 
      name: newTechnicianName.trim(),
      cities: [],
      neighborhoods: []
    });
  };

  const handleUpdateTechnician = () => {
    if (!editingTechnician || !editingTechnician.name.trim()) return;
    updateTechnicianMutation.mutate({ 
      id: editingTechnician.id, 
      name: editingTechnician.name,
      cities: editingTechnician.cities,
      neighborhoods: editingTechnician.neighborhoods
    });
  };

  const handleTechnicianSelection = (technicianId: string, checked: boolean) => {
    setSelectedTechnicians(prev => 
      checked 
        ? [...prev, technicianId]
        : prev.filter(id => id !== technicianId)
    );
  };

  const handleSelectAllTechnicians = (checked: boolean) => {
    setSelectedTechnicians(checked ? technicians.map(tech => tech.id) : []);
  };

  const handleDeleteSelectedTechnicians = () => {
    if (selectedTechnicians.length === 0) return;
    deleteTechniciansMutation.mutate(selectedTechnicians);
  };

  const handleExportData = () => {
    // TODO: Implement actual data export functionality
    toast({ title: "Exportação iniciada", description: "Os dados estão sendo preparados para download." });
  };

  const handleImportData = () => {
    // TODO: Implement actual data import functionality
    toast({ title: "Importação preparada", description: "Selecione o arquivo para importar os dados." });
  };

  // Security handlers
  const handleChangePassword = () => {
    // Verificar senha atual
    const savedPassword = localStorage.getItem("config_primary_password") || "@Imicro#25";
    
    if (currentPassword !== savedPassword) {
      toast({
        description: "Senha atual incorreta.",
        className: "bg-red-500/90 text-white border-red-600"
      });
      return;
    }

    // Verificar se as senhas são iguais
    if (newPassword !== confirmPassword) {
      toast({
        description: "As senhas não conferem.",
        className: "bg-red-500/90 text-white border-red-600"
      });
      return;
    }

    // Verificar se a nova senha tem pelo menos 6 caracteres
    if (newPassword.length < 6) {
      toast({
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        className: "bg-red-500/90 text-white border-red-600"
      });
      return;
    }

    // Salvar nova senha
    localStorage.setItem("config_primary_password", newPassword);
    
    // Limpar campos
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    toast({
      description: "Senha alterada com sucesso!",
      className: "bg-green-500/90 text-white border-green-600"
    });
  };

  const getCurrentPasswordDisplay = () => {
    const savedPassword = localStorage.getItem("config_primary_password") || "@Imicro#25";
    return "*".repeat(savedPassword.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white modal-dialog modal-content config-modal-content flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Configurações
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-config-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="import-export" className="h-full flex flex-col config-modal-tabs">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-secondary/50 flex-shrink-0">
            <TabsTrigger 
              value="import-export" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-import-export"
            >
              Import/Export
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-security"
            >
              Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-general"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger 
              value="tecnicos" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-tecnicos"
            >
              Técnicos
            </TabsTrigger>
            <TabsTrigger 
              value="cidade" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-cidade"
            >
              Cidade
            </TabsTrigger>
            <TabsTrigger 
              value="bairro" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-2 py-1"
              data-testid="tab-bairro"
            >
              Bairro
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <div className="h-full pr-2 pb-4 config-modal-tab-content modal-scroll-container">
            <TabsContent value="import-export" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">Gerenciamento de Dados</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Exportar Dados
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Exporte todos os dados do sistema (técnicos, equipes, ordens de serviço e relatórios) para um arquivo de backup.
                  </p>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleExportData}
                    data-testid="button-export-data"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Dados
                  </Button>
                </div>

                <div className="border-t border-border pt-4">
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Importar Dados
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Importe dados de um arquivo de backup. Esta ação irá substituir os dados existentes.
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleImportData}
                    data-testid="button-import-data"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Dados
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-medium text-white">Gerenciamento de Senhas</h3>
              </div>

              {/* Senha atual */}
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Senha Principal Atual
                    </Label>
                    <p className="text-white font-mono mt-1">{getCurrentPasswordDisplay()}</p>
                  </div>
                  <Lock className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Alteração de senha */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-white">
                  Alterar Senha Principal
                </Label>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Senha Atual
                    </Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite a senha atual"
                      className="bg-secondary border border-border text-white"
                      data-testid="input-current-password"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Nova Senha
                    </Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha (mín. 6 caracteres)"
                      className="bg-secondary border border-border text-white"
                      data-testid="input-new-password"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a nova senha novamente"
                      className="bg-secondary border border-border text-white"
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                    className="bg-primary hover:bg-primary/90 text-white w-full"
                    data-testid="button-change-password"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
              </div>

              {/* Informações de segurança */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">Informações de Segurança</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• A senha principal protege o acesso às configurações do sistema</p>
                  <p>• Use senhas seguras com pelo menos 6 caracteres</p>
                  <p>• As senhas são armazenadas localmente no navegador</p>
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="general" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Tipos de Serviços</h3>
                </div>
                {selectedServiceTypes.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelectedServiceTypes}
                    disabled={deleteServiceTypesMutation.isPending}
                    data-testid="button-delete-selected-service-types"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir ({selectedServiceTypes.length})
                  </Button>
                )}
              </div>

              {/* Adicionar Novo Tipo de Serviço */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Adicionar Novo Tipo de Serviço
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={newServiceTypeName}
                    onChange={(e) => setNewServiceTypeName(e.target.value)}
                    placeholder="Nome do tipo de serviço (ex: ATIVAÇÃO)"
                    className="bg-secondary border border-border text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddServiceType();
                      }
                    }}
                    data-testid="input-new-service-type-name"
                  />
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddServiceType}
                    disabled={createServiceTypeMutation.isPending || !newServiceTypeName.trim()}
                    data-testid="button-add-service-type"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Tipos de Serviços */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Tipos de Serviços Cadastrados ({serviceTypes.length})
                </Label>
                
                {serviceTypes.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="select-all-service-types"
                      checked={selectedServiceTypes.length === serviceTypes.length}
                      onCheckedChange={handleSelectAllServiceTypes}
                    />
                    <label htmlFor="select-all-service-types" className="text-sm text-white cursor-pointer">
                      Selecionar todos ({serviceTypes.length} tipos)
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  {serviceTypes.length === 0 ? (
                    <div className="text-center py-8">
                      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-sm">
                        Nenhum tipo de serviço cadastrado. Adicione um novo tipo acima.
                      </p>
                    </div>
                  ) : (
                    serviceTypes.map((serviceType) => {
                      const isEditing = editingServiceType?.id === serviceType.id;
                      
                      return (
                        <div 
                          key={serviceType.id} 
                          className="glass-card p-3 rounded-lg flex items-center space-x-3"
                          data-testid={`service-type-item-${serviceType.name.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <Checkbox
                            id={serviceType.id}
                            checked={selectedServiceTypes.includes(serviceType.id)}
                            onCheckedChange={(checked) => handleServiceTypeSelection(serviceType.id, checked as boolean)}
                          />
                          
                          {isEditing ? (
                            <div className="flex-1 flex items-center space-x-2">
                              <Input
                                value={editingServiceType.name}
                                onChange={(e) => setEditingServiceType({ ...editingServiceType, name: e.target.value })}
                                className="bg-secondary border border-border text-white flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateServiceType();
                                  } else if (e.key === 'Escape') {
                                    setEditingServiceType(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={handleUpdateServiceType}
                                disabled={updateServiceTypeMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="glass-button text-white border-border"
                                onClick={() => setEditingServiceType(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Settings className="h-4 w-4 text-blue-400" />
                              <span className="flex-1 text-white font-medium">{serviceType.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="glass-button px-2 py-1 text-white"
                                onClick={() => setEditingServiceType(serviceType)}
                                data-testid={`button-edit-service-type-${serviceType.name.replace(/\s+/g, "-").toLowerCase()}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="tecnicos" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Gerenciar Técnicos</h3>
                </div>
                {selectedTechnicians.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelectedTechnicians}
                    disabled={deleteTechniciansMutation.isPending}
                    data-testid="button-delete-selected-technicians"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir ({selectedTechnicians.length})
                  </Button>
                )}
              </div>

              {/* Adicionar Novo Técnico */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Adicionar Novo Técnico
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={newTechnicianName}
                    onChange={(e) => setNewTechnicianName(e.target.value)}
                    placeholder="Nome do técnico"
                    className="bg-secondary border border-border text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTechnician();
                      }
                    }}
                    data-testid="input-new-technician-name"
                  />
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddTechnician}
                    disabled={createTechnicianMutation.isPending || !newTechnicianName.trim()}
                    data-testid="button-add-technician"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Técnicos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Técnicos Cadastrados ({technicians.length})
                </Label>
                
                {technicians.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="select-all-technicians"
                      checked={selectedTechnicians.length === technicians.length}
                      onCheckedChange={handleSelectAllTechnicians}
                    />
                    <label htmlFor="select-all-technicians" className="text-sm text-white cursor-pointer">
                      Selecionar todos ({technicians.length} técnicos)
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  {technicians.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-sm">
                        Nenhum técnico cadastrado. Adicione um novo técnico acima.
                      </p>
                    </div>
                  ) : (
                    technicians.map((technician) => {
                      const isEditing = editingTechnician?.id === technician.id;
                      
                      return (
                        <div 
                          key={technician.id} 
                          className="glass-card p-3 rounded-lg flex items-center space-x-3"
                          data-testid={`technician-item-${technician.name.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <Checkbox
                            id={technician.id}
                            checked={selectedTechnicians.includes(technician.id)}
                            onCheckedChange={(checked) => handleTechnicianSelection(technician.id, checked as boolean)}
                          />
                          
                          {isEditing ? (
                            <div className="flex-1 flex items-center space-x-2">
                              <Input
                                value={editingTechnician.name}
                                onChange={(e) => setEditingTechnician({ ...editingTechnician, name: e.target.value })}
                                className="bg-secondary border border-border text-white flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateTechnician();
                                  } else if (e.key === 'Escape') {
                                    setEditingTechnician(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={handleUpdateTechnician}
                                disabled={updateTechnicianMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="glass-button text-white border-border"
                                onClick={() => setEditingTechnician(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Users className="h-4 w-4 text-green-400" />
                              <span className="flex-1 text-white font-medium">{technician.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="glass-button px-2 py-1 text-white"
                                onClick={() => setEditingTechnician(technician)}
                                data-testid={`button-edit-technician-${technician.name.replace(/\s+/g, "-").toLowerCase()}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="cidade" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Gerenciar Cidades</h3>
                </div>
                {selectedCities.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelectedCities}
                    disabled={deleteCitiesMutation.isPending}
                    data-testid="button-delete-selected-cities"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir ({selectedCities.length})
                  </Button>
                )}
              </div>

              {/* Adicionar Nova Cidade */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Adicionar Nova Cidade
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="Nome da cidade"
                    className="bg-secondary border border-border text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCity();
                      }
                    }}
                    data-testid="input-new-city-name"
                  />
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={handleAddCity}
                    disabled={createCityMutation.isPending || !newCityName.trim()}
                    data-testid="button-add-city"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Cidades */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Cidades Cadastradas ({cities.length})
                </Label>
                
                {cities.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="select-all-cities"
                      checked={selectedCities.length === cities.length}
                      onCheckedChange={handleSelectAllCities}
                    />
                    <label htmlFor="select-all-cities" className="text-sm text-white cursor-pointer">
                      Selecionar todas ({cities.length} cidades)
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  {cities.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-sm">
                        Nenhuma cidade cadastrada. Adicione uma nova cidade acima.
                      </p>
                    </div>
                  ) : (
                    cities.map((city) => {
                      const isEditing = editingCity?.id === city.id;
                      
                      return (
                        <div 
                          key={city.id} 
                          className="glass-card p-3 rounded-lg flex items-center space-x-3"
                          data-testid={`city-item-${city.name.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <Checkbox
                            id={city.id}
                            checked={selectedCities.includes(city.id)}
                            onCheckedChange={(checked) => handleCitySelection(city.id, checked as boolean)}
                          />
                          
                          {isEditing ? (
                            <div className="flex-1 flex items-center space-x-2">
                              <Input
                                value={editingCity.name}
                                onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })}
                                className="bg-secondary border border-border text-white flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateCity();
                                  } else if (e.key === 'Escape') {
                                    setEditingCity(null);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={handleUpdateCity}
                                disabled={updateCityMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="glass-button text-white border-border"
                                onClick={() => setEditingCity(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-blue-400" />
                              <span className="flex-1 text-white font-medium">{city.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="glass-button px-2 py-1 text-white"
                                onClick={() => setEditingCity(city)}
                                data-testid={`button-edit-city-${city.name.replace(/\s+/g, "-").toLowerCase()}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="bairro" className="space-y-6 mt-6 pb-16 data-[state=active]:block config-modal-tab-content">
            <div className="glass-card p-4 lg:p-6 rounded-lg space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Gerenciar Bairros</h3>
                </div>
                {selectedNeighborhoods.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelectedNeighborhoods}
                    disabled={deleteNeighborhoodsMutation.isPending}
                    data-testid="button-delete-selected-neighborhoods"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir ({selectedNeighborhoods.length})
                  </Button>
                )}
              </div>

              {/* Seletor de Cidade */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Selecione uma Cidade para Gerenciar Bairros
                </Label>
                <Select 
                  value={selectedCityForNeighborhoods} 
                  onValueChange={(value) => {
                    setSelectedCityForNeighborhoods(value);
                    setSelectedNeighborhoods([]);
                    setEditingNeighborhood(null);
                    setNewNeighborhoodName("");
                  }}
                >
                  <SelectTrigger className="bg-secondary border border-border text-white">
                    <SelectValue placeholder="Escolha uma cidade..." />
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

              {selectedCityForNeighborhoods && (
                <>
                  {/* Adicionar Novo Bairro */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Adicionar Novo Bairro
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newNeighborhoodName}
                        onChange={(e) => setNewNeighborhoodName(e.target.value)}
                        placeholder="Nome do bairro"
                        className="bg-secondary border border-border text-white flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNeighborhood();
                          }
                        }}
                        data-testid="input-new-neighborhood-name"
                      />
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white"
                        onClick={handleAddNeighborhood}
                        disabled={createNeighborhoodMutation.isPending || !newNeighborhoodName.trim()}
                        data-testid="button-add-neighborhood"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Importar Lista de Bairros */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Importar Lista de Bairros
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cole uma lista de bairros separados por vírgula para importar em lote.
                    </p>
                    <Textarea
                      value={neighborhoodListImport}
                      onChange={(e) => setNeighborhoodListImport(e.target.value)}
                      placeholder="Exemplo: Centro, Vila Nova, Jardim América, Bela Vista, ..."
                      className="bg-secondary border border-border text-white min-h-[100px] resize-y"
                      data-testid="textarea-neighborhood-list-import"
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {neighborhoodListImport.trim() ? 
                          `${neighborhoodListImport.split(',').filter(n => n.trim()).length} bairros na lista` : 
                          "Cole sua lista aqui"
                        }
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleImportNeighborhoodsList}
                        disabled={bulkImportNeighborhoodsMutation.isPending || !neighborhoodListImport.trim()}
                        data-testid="button-import-neighborhoods"
                      >
                        {bulkImportNeighborhoodsMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-1 h-3 w-3" />
                            Importar Lista
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Bairros */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Bairros Cadastrados ({neighborhoods.length})
                    </Label>
                    
                    {neighborhoods.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="select-all-neighborhoods"
                          checked={selectedNeighborhoods.length === neighborhoods.length}
                          onCheckedChange={handleSelectAllNeighborhoods}
                        />
                        <label htmlFor="select-all-neighborhoods" className="text-sm text-white cursor-pointer">
                          Selecionar todos ({neighborhoods.length} bairros)
                        </label>
                      </div>
                    )}

                    <div className="space-y-2">
                      {neighborhoods.length === 0 ? (
                        <div className="text-center py-8">
                          <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-sm">
                            Nenhum bairro cadastrado para esta cidade.
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Adicione um novo bairro acima.
                          </p>
                        </div>
                      ) : (
                        neighborhoods.map((neighborhood) => {
                          const isEditing = editingNeighborhood?.id === neighborhood.id;
                          
                          return (
                            <div 
                              key={neighborhood.id} 
                              className="glass-card p-3 rounded-lg flex items-center space-x-3"
                              data-testid={`neighborhood-item-${neighborhood.name.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Checkbox
                                id={neighborhood.id}
                                checked={selectedNeighborhoods.includes(neighborhood.id)}
                                onCheckedChange={(checked) => handleNeighborhoodSelection(neighborhood.id, checked as boolean)}
                              />
                              
                              {isEditing ? (
                                <div className="flex-1 flex items-center space-x-2">
                                  <Input
                                    value={editingNeighborhood.name}
                                    onChange={(e) => setEditingNeighborhood({ ...editingNeighborhood, name: e.target.value })}
                                    className="bg-secondary border border-border text-white flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateNeighborhood();
                                      } else if (e.key === 'Escape') {
                                        setEditingNeighborhood(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white"
                                    onClick={handleUpdateNeighborhood}
                                    disabled={updateNeighborhoodMutation.isPending}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="glass-button text-white border-border"
                                    onClick={() => setEditingNeighborhood(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Home className="h-4 w-4 text-green-400" />
                                  <span className="flex-1 text-white font-medium">{neighborhood.name}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="glass-button px-2 py-1 text-white"
                                    onClick={() => setEditingNeighborhood(neighborhood)}
                                    data-testid={`button-edit-neighborhood-${neighborhood.name.replace(/\s+/g, "-").toLowerCase()}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
            </div>
          </div>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}