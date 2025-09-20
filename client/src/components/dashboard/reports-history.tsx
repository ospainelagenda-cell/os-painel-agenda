import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Calendar, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Report } from "@shared/schema";

interface ReportsHistoryProps {
  onViewReport: (reportContent: string) => void;
}

export default function ReportsHistory({ onViewReport }: ReportsHistoryProps) {
  const [activeTab, setActiveTab] = useState("past");
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"]
  });

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Separate reports by date
  const pastReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate < today;
  }).sort((a, b) => 
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  const futureReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate >= today;
  }).sort((a, b) => 
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift.toLowerCase()) {
      case 'manhã':
      case 'manha':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'tarde':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'noite':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const renderReportsList = (reportsList: Report[], emptyMessage: string) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {reportsList.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground text-sm">
            {emptyMessage}
          </p>
        </div>
      ) : (
        reportsList.map((report) => (
          <div 
            key={report.id} 
            className="glass-card p-4 rounded-lg hover:bg-white/5 transition-colors"
            data-testid={`report-item-${report.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-white truncate">
                    {report.name}
                  </h4>
                  <span 
                    className={`text-xs px-2 py-1 rounded border ${getShiftColor(report.shift)}`}
                  >
                    {report.shift}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(report.date)}</span>
                  </div>
                  {report.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Criado: {formatDateTime(report.createdAt?.toString() || null)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="glass-button px-3 py-1 text-white ml-2"
                onClick={() => onViewReport(report.content)}
                data-testid={`button-view-report-${report.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Histórico de Relatórios</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded border border-border">
          {reports.length} relatórios
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card">
          <TabsTrigger 
            value="past" 
            className="text-white data-[state=active]:bg-primary data-[state=active]:text-white"
            data-testid="tab-past-reports"
          >
            Dias Passados ({pastReports.length})
          </TabsTrigger>
          <TabsTrigger 
            value="future" 
            className="text-white data-[state=active]:bg-primary data-[state=active]:text-white"
            data-testid="tab-future-reports"
          >
            Dias Futuros ({futureReports.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="past" className="mt-4">
          {renderReportsList(pastReports, "Nenhum relatório de dias passados ainda.")}
          {pastReports.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Mostrando todos os {pastReports.length} relatórios passados
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="future" className="mt-4">
          {renderReportsList(futureReports, "Nenhum relatório de dias futuros ainda.")}
          {futureReports.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Mostrando todos os {futureReports.length} relatórios futuros
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}