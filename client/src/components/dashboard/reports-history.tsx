import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Calendar, Clock, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@shared/schema";

interface ReportsHistoryProps {
  onViewReport: (report: Report) => void;
}

export default function ReportsHistory({ onViewReport }: ReportsHistoryProps) {
  const [activeTab, setActiveTab] = useState("auto");
  const [selectedReportId, setSelectedReportId] = useState<string | "auto">("auto");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"]
  });
  
  // Update current time every 30 seconds to make filtering reactive
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(timer);
  }, []);

  // Time-based filtering utility functions (using currentTime for reactivity)
  const getCurrentShift = () => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const timeInMinutes = currentHour * 60 + currentMinute; // Convert to minutes
    
    // Morning: 07:00 to 13:00 (420 to 780 minutes)
    // Afternoon: 13:01 to 22:00 (781 to 1320 minutes)
    if (timeInMinutes >= 420 && timeInMinutes <= 780) {
      return 'Manhã';
    } else if (timeInMinutes >= 781 && timeInMinutes <= 1320) {
      return 'Tarde';
    }
    return null; // Outside operating hours
  };
  
  // Helper function to get local date string (YYYY-MM-DD) avoiding UTC issues
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getAutoFilteredReport = () => {
    const currentShift = getCurrentShift();
    if (!currentShift) return null;
    
    const currentDateStr = getLocalDateString(currentTime);
    
    // For morning shift, look for reports of current date
    // For afternoon shift, look for reports of current date
    const targetReports = reports.filter(report => {
      const reportDate = report.date;
      const reportShift = report.shift;
      
      return reportDate === currentDateStr && 
             reportShift.toLowerCase() === currentShift.toLowerCase();
    });
    
    // Return the most recent report for the current shift and date
    // Use robust sorting with fallback to report.date if createdAt is missing
    return targetReports.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
      return bTime - aTime;
    })[0] || null;
  };
  
  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto-filtered current report (depends on currentTime for reactivity)
  const autoReport = useMemo(() => getAutoFilteredReport(), [reports, currentTime]);
  const currentShift = getCurrentShift();
  const isInOperatingHours = currentShift !== null;
  const isAutoMode = selectedReportId === "auto";
  
  // Separate reports by date with robust sorting
  const pastReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate < today;
  }).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
    return bTime - aTime;
  });

  const futureReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    reportDate.setHours(0, 0, 0, 0);
    return reportDate >= today;
  }).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
    return bTime - aTime;
  });
  
  // Get report to display based on selection
  const getDisplayReport = () => {
    if (activeTab === "auto") {
      if (selectedReportId === "auto") {
        return autoReport;
      } else {
        return reports.find(r => r.id === selectedReportId) || null;
      }
    }
    return null;
  };
  
  const displayReport = getDisplayReport();
  const isShowingAutoReport = isAutoMode && displayReport?.id === autoReport?.id;

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
                onClick={() => onViewReport(report)}
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
  
  const renderCurrentReport = () => {
    if (!displayReport) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h4 className="text-lg font-medium text-white mb-2">Nenhum relatório encontrado</h4>
          <p className="text-muted-foreground text-sm">
            {activeTab === "auto" 
              ? isInOperatingHours 
                ? `Não há relatório disponível para ${currentShift} de hoje`
                : "Fora do horário de operação (07:00-22:00)"
              : "Selecione um relatório para visualizar"
            }
          </p>
        </div>
      );
    }
    
    return (
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-xl font-semibold text-white truncate">
                {displayReport.name}
              </h3>
              <Badge className={`${getShiftColor(displayReport.shift)} text-xs`}>
                {displayReport.shift}
              </Badge>
              {isShowingAutoReport && isInOperatingHours && autoReport && (
                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  Atual
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Data: {formatDate(displayReport.date)}</span>
              </div>
              {displayReport.createdAt && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Criado: {formatDateTime(displayReport.createdAt?.toString() || null)}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="default"
            className="ml-4 flex-shrink-0"
            onClick={() => onViewReport(displayReport)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Relatório Completo
          </Button>
        </div>
        
        <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
            {displayReport.content.length > 300 
              ? displayReport.content.substring(0, 300) + "...\n\n[Clique em 'Ver Relatório Completo' para ver tudo]"
              : displayReport.content
            }
          </pre>
        </div>
      </div>
    );
  };

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
        <TabsList className="grid w-full grid-cols-3 glass-card">
          <TabsTrigger 
            value="auto" 
            className="text-white data-[state=active]:bg-primary data-[state=active]:text-white"
            data-testid="tab-auto-report"
          >
            <div className="flex items-center space-x-2">
              <span>Atual</span>
              {isInOperatingHours && autoReport && isAutoMode && (
                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30 ml-1">
                  •
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="text-white data-[state=active]:bg-primary data-[state=active]:text-white"
            data-testid="tab-past-reports"
          >
            Passados ({pastReports.length})
          </TabsTrigger>
          <TabsTrigger 
            value="future" 
            className="text-white data-[state=active]:bg-primary data-[state=active]:text-white"
            data-testid="tab-future-reports"
          >
            Futuros ({futureReports.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="auto" className="mt-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtro Manual:</span>
              </div>
              {isInOperatingHours && (
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  Turno: {currentShift}
                </Badge>
              )}
            </div>
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger className="glass-card border-border text-white">
                <SelectValue placeholder="Automático - mostra relatório do turno atual" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border">
                <SelectItem value="auto" className="text-white hover:bg-white/10">
                  🤖 Automático - Turno Atual
                </SelectItem>
                {reports.length > 0 && (
                  reports
                    .sort((a, b) => {
                      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
                      if (dateCompare === 0) {
                        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
                      }
                      return dateCompare;
                    })
                    .map((report) => (
                      <SelectItem key={report.id} value={report.id} className="text-white hover:bg-white/10">
                        📄 {report.name} - {formatDate(report.date)} ({report.shift})
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {renderCurrentReport()}
          
          {isInOperatingHours && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300">
                💡 <strong>Filtro Automático:</strong> Mostra o relatório do turno atual ({currentShift}) automaticamente.
                {currentShift === 'Manhã' && <span> Relatórios de manhã são visíveis das 07:00 às 13:00.</span>}
                {currentShift === 'Tarde' && <span> Relatórios de tarde são visíveis das 13:01 às 22:00.</span>}
              </p>
            </div>
          )}
        </TabsContent>
        
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