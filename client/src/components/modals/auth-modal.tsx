import { useState } from "react";
import { X, Lock, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ open, onOpenChange, onAuthSuccess }: AuthModalProps) {
  const [primaryPassword, setPrimaryPassword] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [activeTab, setActiveTab] = useState("primary");
  const { toast } = useToast();

  // Senhas padrão
  const DEFAULT_PRIMARY_PASSWORD = "@Imicro#25";
  const SECURITY_PASSWORD = "15100022";

  // Recuperar senha principal salva no localStorage
  const getSavedPrimaryPassword = () => {
    return localStorage.getItem("config_primary_password") || DEFAULT_PRIMARY_PASSWORD;
  };

  const handlePrimaryAuth = () => {
    const savedPassword = getSavedPrimaryPassword();
    
    if (primaryPassword === savedPassword) {
      toast({
        description: "Autenticação realizada com sucesso!",
        className: "bg-green-500/90 text-white border-green-600"
      });
      setPrimaryPassword("");
      onOpenChange(false);
      onAuthSuccess();
    } else {
      toast({
        description: "Senha incorreta. Tente novamente.",
        className: "bg-red-500/90 text-white border-red-600"
      });
      setPrimaryPassword("");
    }
  };

  const handleSecurityAuth = () => {
    if (securityPassword === SECURITY_PASSWORD) {
      // Reset da senha principal para a padrão
      localStorage.setItem("config_primary_password", DEFAULT_PRIMARY_PASSWORD);
      
      toast({
        description: "Senha de segurança validada! Senha principal resetada para padrão.",
        className: "bg-amber-500/90 text-white border-amber-600"
      });
      setSecurityPassword("");
      onOpenChange(false);
      onAuthSuccess();
    } else {
      toast({
        description: "Senha de segurança incorreta.",
        className: "bg-red-500/90 text-white border-red-600"
      });
      setSecurityPassword("");
    }
  };

  const handleClose = () => {
    setPrimaryPassword("");
    setSecurityPassword("");
    setActiveTab("primary");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/30 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <Lock className="mr-2 h-5 w-5 text-primary" />
              Autenticação
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={handleClose}
              data-testid="button-close-auth-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger 
                value="primary" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Lock className="mr-2 h-4 w-4" />
                Senha Principal
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Senha de Segurança
              </TabsTrigger>
            </TabsList>

            <TabsContent value="primary" className="mt-6">
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Digite a senha principal para acessar as configurações
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2">
                    Senha Principal
                  </Label>
                  <Input
                    type="password"
                    value={primaryPassword}
                    onChange={(e) => setPrimaryPassword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handlePrimaryAuth)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Digite a senha principal"
                    autoFocus
                    data-testid="input-primary-password"
                  />
                </div>

                <Button
                  onClick={handlePrimaryAuth}
                  disabled={!primaryPassword}
                  className="w-full bg-primary hover:bg-primary/90 py-3 rounded-lg text-white font-medium"
                  data-testid="button-primary-auth"
                >
                  Acessar Configurações
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="space-y-4">
                <div className="text-center text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                  <Shield className="mx-auto h-6 w-6 mb-2" />
                  Use esta opção caso a senha principal tenha sido alterada sem autorização.
                  <br />
                  <strong>Isso irá resetar a senha principal para o padrão.</strong>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2">
                    Senha de Segurança
                  </Label>
                  <Input
                    type="password"
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleSecurityAuth)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Digite a senha de segurança"
                    data-testid="input-security-password"
                  />
                </div>

                <Button
                  onClick={handleSecurityAuth}
                  disabled={!securityPassword}
                  className="w-full bg-amber-600 hover:bg-amber-700 py-3 rounded-lg text-white font-medium"
                  data-testid="button-security-auth"
                >
                  Resetar e Acessar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}