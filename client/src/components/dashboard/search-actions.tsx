import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Download, CheckCircle, XCircle, RotateCcw, Sticker, Ban, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceOrder } from "@shared/schema";
import EditServiceModal from "@/components/modals/edit-service-modal";

interface SearchActionsProps {
  onNewReport: () => void;
}

export default function SearchActions({ onNewReport }: SearchActionsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ServiceOrder | null>(null);
  const [suggestions, setSuggestions] = useState<ServiceOrder[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get all service orders for filtering
  const { data: allServiceOrders = [] } = useQuery({
    queryKey: ["/api/service-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/service-orders");
      return await response.json();
    }
  });

  const searchMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/service-orders/search/${code}`);
      return await response.json();
    },
    onSuccess: (data) => {
      setSearchResult(data);
    },
    onError: () => {
      setSearchResult(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/service-orders/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      // Refresh search result
      if (searchResult) {
        searchMutation.mutate(searchResult.code);
      }
    }
  });

  // Auto-search with debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && allServiceOrders.length > 0) {
      const filtered = allServiceOrders.filter((order: ServiceOrder) => 
        order.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      if (searchQuery.trim().length === 0) {
        setSearchResult(null);
      }
    }
  }, [searchQuery, allServiceOrders.length]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (order: ServiceOrder) => {
    setSearchQuery(order.code);
    setSearchResult(order);
    setShowSuggestions(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (searchResult) {
      updateStatusMutation.mutate({ id: searchResult.id, status: newStatus });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2 glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Buscar Ordem de Serviço</h3>
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Digite o código da OS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
              data-testid="input-search-os"
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 hover:bg-primary/20 cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => handleSuggestionClick(order)}
                    data-testid={`suggestion-${order.code}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">OS #{order.code}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{order.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${
                          order.status === 'Concluído' ? 'bg-green-950/80 text-green-400 border border-green-500/30' :
                          order.status === 'Pendente' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' :
                          order.status === 'Reagendado' ? 'bg-red-950/80 text-red-400 border border-red-500/30' :
                          order.status === 'Adesivado' ? 'bg-blue-950/80 text-blue-400 border border-blue-500/30' :
                          order.status === 'Cancelado' ? 'bg-gray-950/80 text-gray-400 border border-gray-500/30' :
                          'bg-purple-950/80 text-purple-400 border border-purple-500/30'
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
                        {order.alert && (
                          <span className="text-xs bg-amber-950/80 text-amber-400 px-2 py-1 rounded border border-amber-500/30">
                            Alerta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            className="glass-button px-6 py-3 rounded-lg text-white font-medium"
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            data-testid="button-search"
          >
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {searchResult && (
          <div className="mt-4 space-y-2">
            <div className="glass-card p-4 rounded-lg" data-testid={`search-result-${searchResult.code}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">OS #{searchResult.code}</span>
                  <span className="ml-3 text-sm text-muted-foreground">{searchResult.type}</span>
                  {searchResult.alert && (
                    <span className="ml-3 text-xs bg-amber-500/90 text-amber-950 px-2 py-1 rounded border border-amber-400/50">
                      Alerta
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-white p-2"
                    onClick={() => setEditModalOpen(true)}
                    data-testid="button-edit-service-order"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Select value={searchResult.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 bg-secondary border border-border rounded-lg text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectItem value="Pendente">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-yellow-400" />
                        <span>Pendente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                  </Select>
                </div>
              </div>
              {searchResult.alert && (
                <div className="mt-2 text-sm text-yellow-400">
                  <strong>Alerta:</strong> {searchResult.alert}
                </div>
              )}
            </div>
          </div>
        )}

        {searchMutation.isError && searchQuery && (
          <div className="mt-4 text-red-400 text-sm">
            Ordem de serviço não encontrada
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
        <div className="space-y-3">
          <Button
            className="w-full glass-button p-3 rounded-lg text-white font-medium text-left justify-start"
            onClick={onNewReport}
            data-testid="button-new-report"
          >
            <Plus className="mr-3 text-primary" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Modal de edição */}
      <EditServiceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        serviceOrder={searchResult}
      />
    </div>
  );
}
