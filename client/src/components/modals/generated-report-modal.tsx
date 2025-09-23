import { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Save, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GeneratedReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportContent: string;
  reportName?: string;
  reportDate?: string;
  reportShift?: string;
  reportBoxes?: any[];
  reportMetadata?: any;
  onEditReport?: () => void;
  shouldAutoSave?: boolean;
}

export default function GeneratedReportModal({ 
  open, 
  onOpenChange, 
  reportContent, 
  reportName = "Relatório", 
  reportDate = new Date().toISOString().split('T')[0], 
  reportShift = "Manhã",
  reportBoxes = [],
  reportMetadata = null,
  onEditReport,
  shouldAutoSave = false
}: GeneratedReportModalProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasAutoSaved = useRef(false);
  const { toast } = useToast();

  const saveReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/reports', {
        name: reportName,
        date: reportDate,
        shift: reportShift,
        content: reportContent,
        boxes: reportBoxes && reportBoxes.length > 0 ? reportBoxes : null,
        metadata: reportMetadata ? reportMetadata : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({
        title: "Sucesso!",
        description: "Relatório salvo com sucesso no histórico.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Auto-save report when modal opens with content (only once per modal session and only if shouldAutoSave is true)
  useEffect(() => {
    if (open && reportContent && shouldAutoSave && !hasAutoSaved.current) {
      hasAutoSaved.current = true;
      saveReportMutation.mutate();
    }
    
    // Reset when modal closes
    if (!open) {
      hasAutoSaved.current = false;
      setSaved(false);
    }
  }, [open, reportContent, shouldAutoSave]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Relatório Gerado
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-generated-report"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div 
          className="bg-secondary rounded-lg p-4 mb-4 font-mono text-sm text-white whitespace-pre-wrap flex-1 overflow-y-auto"
          data-testid="text-report-content"
        >
          {reportContent}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="glass-button py-3 rounded-lg text-white font-medium"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-report"
          >
            Fechar
          </Button>
          
          {onEditReport && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 py-3 rounded-lg text-white font-medium"
              onClick={() => {
                onEditReport();
                onOpenChange(false);
              }}
              data-testid="button-edit-report"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Serviços
            </Button>
          )}
          
          <Button
            className="bg-green-600 hover:bg-green-700 py-3 rounded-lg text-white font-medium"
            onClick={() => saveReportMutation.mutate()}
            disabled={saveReportMutation.isPending || saved}
            data-testid="button-save-report"
          >
            {saveReportMutation.isPending ? (
              "Salvando..."
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
          
          <Button
            className="bg-primary hover:bg-primary/90 py-3 rounded-lg text-white font-medium"
            onClick={copyToClipboard}
            data-testid="button-copy-report"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
