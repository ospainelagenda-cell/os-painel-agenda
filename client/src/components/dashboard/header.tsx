import { ClipboardList, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onConfigClick: () => void;
}

export default function Header({ onConfigClick }: HeaderProps) {
  return (
    <header className="glass-card rounded-none border-b border-border/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
              <ClipboardList className="text-primary text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="header-title">
                Dashboard OS
              </h1>
              <p className="text-muted-foreground text-sm">
                Gerenciamento de Ordens de Serviço
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="glass-button px-4 py-2 rounded-lg text-white text-sm font-medium"
              onClick={onConfigClick}
              data-testid="button-config"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
