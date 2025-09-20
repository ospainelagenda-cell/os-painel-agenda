import { useState } from "react";
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
import ReminderAlerts from "@/components/dashboard/reminder-alerts";

export default function Dashboard() {
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
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamIdForService, setSelectedTeamIdForService] = useState<string>("");
  const [selectedTeamIdForServices, setSelectedTeamIdForServices] = useState<string>("");
  const [selectedTeamNameForServices, setSelectedTeamNameForServices] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDateForServices, setSelectedDateForServices] = useState<Date | undefined>();
  const [generatedReportContent, setGeneratedReportContent] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [reportDate, setReportDate] = useState<string>("");
  const [reportShift, setReportShift] = useState<string>("");

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

  const handleReportGenerated = (content: string, name?: string, date?: string, shift?: string) => {
    setGeneratedReportContent(content);
    setReportName(name || "Relat\u00f3rio");
    setReportDate(date || new Date().toISOString().split('T')[0]);
    setReportShift(shift || "Manh\u00e3");
    setReportModalOpen(false);
    setGeneratedReportModalOpen(true);
  };

  const handleViewReport = (reportContent: string) => {
    setGeneratedReportContent(reportContent);
    setGeneratedReportModalOpen(true);
  };

  const handleEditReport = () => {
    setGeneratedReportModalOpen(false);
    setEditDayServicesModalOpen(true);
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
      />

      <GeneratedReportModal
        open={generatedReportModalOpen}
        onOpenChange={setGeneratedReportModalOpen}
        reportContent={generatedReportContent}
        reportName={reportName}
        reportDate={reportDate}
        reportShift={reportShift}
        onEditReport={handleEditReport}
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
