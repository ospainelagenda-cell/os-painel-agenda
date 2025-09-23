import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/dashboard/header";
import AlertsSection from "@/components/dashboard/alerts-section";
import SearchActions from "@/components/dashboard/search-actions";
import TeamsGrid from "@/components/dashboard/teams-grid";
import CalendarView from "@/components/dashboard/calendar-view";
import ReportsHistory from "@/components/dashboard/reports-history";
import ReportModal from "@/components/modals/report-modal";
import GeneratedReportModal from "@/components/modals/generated-report-modal";
import ReallocationModal from "@/components/modals/reallocation-modal";
import ConfigModal from "@/components/modals/config-modal";
import AuthModal from "@/components/modals/auth-modal";
import SchedulingModal from "@/components/modals/scheduling-modal";
import DayServicesModal from "@/components/modals/day-services-modal";
import AddServiceModal from "@/components/modals/add-service-modal";
import TeamServicesModal from "@/components/modals/team-services-modal";
import EditDayServicesModal from "@/components/modals/edit-day-services-modal";
import ManageTechniciansModal from "@/components/modals/manage-technicians-modal";
import TechnicianServicesReallocationModal from "@/components/modals/technician-services-reallocation-modal";
import ReminderAlerts from "@/components/dashboard/reminder-alerts";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatedReportModalOpen, setGeneratedReportModalOpen] = useState(false);
  const [reallocationModalOpen, setReallocationModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState(false);
  const [dayServicesModalOpen, setDayServicesModalOpen] = useState(false);
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [teamServicesModalOpen, setTeamServicesModalOpen] = useState(false);
  const [editDayServicesModalOpen, setEditDayServicesModalOpen] = useState(false);
  const [manageTechniciansModalOpen, setManageTechniciansModalOpen] = useState(false);
  const [technicianServicesReallocationModalOpen, setTechnicianServicesReallocationModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamIdForService, setSelectedTeamIdForService] = useState<string>("");
  const [selectedTeamIdForServices, setSelectedTeamIdForServices] = useState<string>("");
  const [selectedTeamNameForServices, setSelectedTeamNameForServices] = useState<string>("");
  const [selectedTeamIdForTechnicians, setSelectedTeamIdForTechnicians] = useState<string>("");
  const [technicianWithServices, setTechnicianWithServices] = useState<{
    id: string;
    name: string;
    serviceOrders: any[];
    action: 'remove' | 'move';
    targetTeamId?: string;
    sourceTeamId: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDateForServices, setSelectedDateForServices] = useState<Date | undefined>();
  const [generatedReportContent, setGeneratedReportContent] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [reportDate, setReportDate] = useState<string>("");
  const [reportShift, setReportShift] = useState<string>("");
  const [shouldAutoSave, setShouldAutoSave] = useState<boolean>(false);
  const [reportEditMode, setReportEditMode] = useState<boolean>(false);
  const [existingReportContent, setExistingReportContent] = useState<string>("");
  const [reportBoxes, setReportBoxes] = useState<any[]>([]);
  const [reportMetadata, setReportMetadata] = useState<any>(null);
  const [existingReportBoxes, setExistingReportBoxes] = useState<any[]>([]);
  const [existingReportMetadata, setExistingReportMetadata] = useState<any>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  const handleReallocation = (teamId: string) => {
    setSelectedTeamId(teamId);
    setReallocationModalOpen(true);
  };



  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSchedulingModalOpen(true);
  };

  const handleViewDayServices = (date: Date) => {
    setSelectedDateForServices(date);
    setDayServicesModalOpen(true);
  };

  const handleAddServiceOrder = (teamId: string) => {
    setSelectedTeamIdForService(teamId);
    setAddServiceModalOpen(true);
  };

  const handleViewTeamServices = (teamId: string, teamName: string) => {
    setSelectedTeamIdForServices(teamId);
    setSelectedTeamNameForServices(teamName);
    setTeamServicesModalOpen(true);
  };

  const handleManageTechnicians = (teamId: string) => {
    setSelectedTeamIdForTechnicians(teamId);
    setManageTechniciansModalOpen(true);
  };

  const handleTechnicianWithServices = (
    technicianId: string, 
    technicianName: string, 
    serviceOrders: any[], 
    action: 'remove' | 'move', 
    targetTeamId?: string
  ) => {
    setTechnicianWithServices({
      id: technicianId,
      name: technicianName,
      serviceOrders,
      action,
      targetTeamId,
      sourceTeamId: selectedTeamIdForTechnicians
    });
    setTechnicianServicesReallocationModalOpen(true);
  };

  const handleCompleteReallocation = async () => {
    if (!technicianWithServices) return;

    const { id: technicianId, action, targetTeamId, sourceTeamId } = technicianWithServices;

    try {
      if (action === 'remove') {
        // Remover técnico da equipe atual
        const response = await fetch(`/api/teams/${sourceTeamId}`);
        const sourceTeam = await response.json();
        
        const newTechnicianIds = sourceTeam.technicianIds.filter((id: string) => id !== technicianId);
        
        await fetch(`/api/teams/${sourceTeamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sourceTeam.name,
            boxNumber: sourceTeam.boxNumber,
            notes: sourceTeam.notes,
            technicianIds: newTechnicianIds
          })
        });
      } else if (action === 'move' && targetTeamId) {
        // Mover técnico da equipe atual para a equipe de destino
        const [sourceResponse, targetResponse] = await Promise.all([
          fetch(`/api/teams/${sourceTeamId}`),
          fetch(`/api/teams/${targetTeamId}`)
        ]);
        
        const sourceTeam = await sourceResponse.json();
        const targetTeam = await targetResponse.json();
        
        const sourceNewIds = sourceTeam.technicianIds.filter((id: string) => id !== technicianId);
        const targetNewIds = [...targetTeam.technicianIds, technicianId];
        
        await Promise.all([
          fetch(`/api/teams/${sourceTeamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sourceTeam.name,
              boxNumber: sourceTeam.boxNumber,
              notes: sourceTeam.notes,
              technicianIds: sourceNewIds
            })
          }),
          fetch(`/api/teams/${targetTeamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: targetTeam.name,
              boxNumber: targetTeam.boxNumber,
              notes: targetTeam.notes,
              technicianIds: targetNewIds
            })
          })
        ]);
      }

      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });

      // Fechar modais e limpar estado
      setTechnicianServicesReallocationModalOpen(false);
      setTechnicianWithServices(null);
      setManageTechniciansModalOpen(true); // Reabrir o modal de gerenciamento
      
    } catch (error) {
      console.error('Erro ao completar realocação:', error);
    }
  };

  const handleReportGenerated = (content: string, name?: string, date?: string, shift?: string, boxes?: any[], metadata?: any) => {
    setGeneratedReportContent(content);
    setReportName(name || "Relat\u00f3rio");
    setReportDate(date || new Date().toISOString().split('T')[0]);
    setReportShift(shift || "Manh\u00e3");
    setReportBoxes(boxes || []);
    setReportMetadata(metadata || null);
    setCurrentReportId(null); // Clear report ID for new reports
    setShouldAutoSave(!reportEditMode); // Auto-save only for newly generated reports, not when editing
    setReportEditMode(false); // Reset edit mode
    setReportModalOpen(false);
    setGeneratedReportModalOpen(true);
  };

  const handleViewReport = (report: any) => {
    setGeneratedReportContent(report.content);
    setReportName(report.name);
    setReportDate(report.date);
    setReportShift(report.shift);
    setReportBoxes(report.boxes || []);
    setReportMetadata(report.metadata || null);
    setCurrentReportId(report.id); // Store the report ID
    setShouldAutoSave(false); // Do not auto-save for viewing existing reports
    setGeneratedReportModalOpen(true);
  };

  const handleEditReport = () => {
    setGeneratedReportModalOpen(false);
    setReportEditMode(true);
    setExistingReportContent(generatedReportContent); // Pass the report content for editing
    setExistingReportBoxes(reportBoxes); // Pass structured data for editing
    setExistingReportMetadata(reportMetadata); // Pass metadata for editing
    setReportModalOpen(true);
  };

  const handleServicesUpdated = () => {
    // This will trigger a refresh of the data
  };

  const handleConfigClick = () => {
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setConfigModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="floating-elements" />
      
      <Header onConfigClick={handleConfigClick} />
      
      <div className="container mx-auto px-4 py-6">
        <AlertsSection />
        
        <SearchActions
          onNewReport={() => setReportModalOpen(true)}
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <TeamsGrid
              onReallocate={handleReallocation}
              onAddServiceOrder={handleAddServiceOrder}
              onViewTeamServices={handleViewTeamServices}
              onManageTechnicians={handleManageTechnicians}
            />
          </div>
          <div className="xl:col-span-1">
            <CalendarView 
              onDateClick={handleDateClick} 
              onViewDayServices={handleViewDayServices}
            />
          </div>
        </div>

        <div className="mb-6">
          <ReportsHistory onViewReport={handleViewReport} />
        </div>
      </div>

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onReportGenerated={handleReportGenerated}
        editMode={reportEditMode}
        existingReportName={reportName}
        existingReportDate={reportDate}
        existingReportShift={reportShift}
        existingReportContent={existingReportContent}
        existingReportBoxes={existingReportBoxes}
        existingReportMetadata={existingReportMetadata}
      />

      <GeneratedReportModal
        open={generatedReportModalOpen}
        onOpenChange={setGeneratedReportModalOpen}
        reportContent={generatedReportContent}
        reportName={reportName}
        reportDate={reportDate}
        reportShift={reportShift}
        reportBoxes={reportBoxes}
        reportMetadata={reportMetadata}
        onEditReport={handleEditReport}
        shouldAutoSave={shouldAutoSave}
        reportId={currentReportId}
        isEditMode={reportEditMode}
      />


      <ReallocationModal
        open={reallocationModalOpen}
        onOpenChange={setReallocationModalOpen}
        teamId={selectedTeamId}
      />


      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />

      <SchedulingModal
        open={schedulingModalOpen}
        onOpenChange={setSchedulingModalOpen}
        selectedDate={selectedDate}
      />

      <DayServicesModal
        open={dayServicesModalOpen}
        onOpenChange={setDayServicesModalOpen}
        selectedDate={selectedDateForServices}
      />

      <AddServiceModal
        open={addServiceModalOpen}
        onOpenChange={setAddServiceModalOpen}
        teamId={selectedTeamIdForService}
      />

      <TeamServicesModal
        open={teamServicesModalOpen}
        onOpenChange={setTeamServicesModalOpen}
        teamId={selectedTeamIdForServices}
        teamName={selectedTeamNameForServices}
      />

      <EditDayServicesModal
        open={editDayServicesModalOpen}
        onOpenChange={setEditDayServicesModalOpen}
        selectedDate={reportDate}
        onServicesUpdated={handleServicesUpdated}
      />

      <ManageTechniciansModal
        open={manageTechniciansModalOpen}
        onOpenChange={setManageTechniciansModalOpen}
        teamId={selectedTeamIdForTechnicians}
        onTechnicianWithServices={handleTechnicianWithServices}
      />

      <TechnicianServicesReallocationModal
        open={technicianServicesReallocationModalOpen}
        onOpenChange={setTechnicianServicesReallocationModalOpen}
        technicianId={technicianWithServices?.id || ""}
        technicianName={technicianWithServices?.name || ""}
        serviceOrders={technicianWithServices?.serviceOrders || []}
        onCompleteReallocation={handleCompleteReallocation}
      />

      <ReminderAlerts />
      
      {/* Footer */}
      <div className="text-center py-4 mt-8">
        <p className="text-white/60 text-sm">
          Desenvolvido por <span className="text-blue-300 font-medium">Odair.dev</span>
        </p>
      </div>
    </div>
  );
}
