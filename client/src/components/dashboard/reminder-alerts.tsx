import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, Phone, MapPin, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceOrder, Team } from "@shared/schema";

export default function ReminderAlerts() {
  const [showAlerts, setShowAlerts] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  // Get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Filter service orders scheduled for tomorrow that have reminders enabled and were created via calendar
  const tomorrowServices = serviceOrders.filter(order => {
    const isForTomorrow = order.scheduledDate === getTomorrowDate();
    const hasReminder = order.reminderEnabled !== false;
    const notDismissed = !dismissedAlerts.has(order.id);
    const isPending = order.status === "Pendente";
    const createdViaCalendar = order.createdViaCalendar === true;
    
    return isForTomorrow && hasReminder && notDismissed && isPending && createdViaCalendar;
  });

  // Check for alerts on component mount and set up periodic checking
  useEffect(() => {
    if (tomorrowServices.length > 0) {
      setShowAlerts(true);
    }

    // Check every hour for new services (3600000 ms = 1 hour)
    const interval = setInterval(() => {
      if (tomorrowServices.length > 0) {
        setShowAlerts(true);
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, [tomorrowServices.length]);

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Sem equipe";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Equipe não encontrada";
  };

  const dismissAlert = (serviceId: string) => {
    setDismissedAlerts(prev => new Set([...prev, serviceId]));
    
    // If no more alerts, hide the component
    const remainingAlerts = tomorrowServices.filter(service => service.id !== serviceId);
    if (remainingAlerts.length === 0) {
      setShowAlerts(false);
    }
  };

  const dismissAllAlerts = () => {
    const newDismissed = new Set([...dismissedAlerts]);
    tomorrowServices.forEach(service => newDismissed.add(service.id));
    setDismissedAlerts(newDismissed);
    setShowAlerts(false);
  };

  const formatTime = (time: string | null) => {
    if (!time) return "Horário não definido";
    return time;
  };

  if (!showAlerts || tomorrowServices.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="glass-card border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-400 animate-pulse" />
              <h3 className="font-semibold text-white">
                Lembretes para Amanhã
              </h3>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-yellow-400 hover:text-white"
                onClick={dismissAllAlerts}
              >
                Dispensar Todos
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-white"
                onClick={() => setShowAlerts(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tomorrowServices.map((service) => (
              <div
                key={service.id}
                className="glass-card p-3 rounded-lg border border-yellow-400/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-white">
                      OS #{service.code}
                    </span>
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">
                      {service.type}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-white"
                    onClick={() => dismissAlert(service.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(service.scheduledTime)}</span>
                  </div>

                  {service.customerName && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{service.customerName}</span>
                    </div>
                  )}

                  {service.customerPhone && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{service.customerPhone}</span>
                    </div>
                  )}

                  {service.address && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{service.address}</span>
                    </div>
                  )}

                  <div className="text-primary text-xs mt-2">
                    Equipe: {getTeamName(service.teamId)}
                  </div>

                  {service.alert && (
                    <div className="glass-card p-2 mt-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
                      <p className="text-yellow-400 text-xs">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {service.alert}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {tomorrowServices.length > 1 && (
            <div className="mt-3 pt-2 border-t border-border/20">
              <p className="text-xs text-muted-foreground text-center">
                {tomorrowServices.length} serviços agendados para amanhã
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}