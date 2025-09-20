import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar, Clock, Eye, CheckCircle, XCircle, RotateCcw, Sticker, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceOrder, Team } from "@shared/schema";

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface CalendarViewProps {
  onDateClick?: (date: Date) => void;
  onViewDayServices?: (date: Date) => void;
}

export default function CalendarView({ onDateClick, onViewDayServices }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: serviceOrders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"]
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "";
  };

  const getServiceOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return serviceOrders.filter(order => order.scheduledDate === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-500";
      case "Pendente":
        return "bg-yellow-500";
      case "Reagendado":
        return "bg-red-500";
      case "Adesivado":
        return "bg-blue-500";
      case "Cancelado":
        return "bg-gray-500";
      default:
        return "bg-purple-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído":
        return <CheckCircle className="h-3 w-3 text-white" />;
      case "Reagendado":
        return <RotateCcw className="h-3 w-3 text-white" />;
      case "Adesivado":
        return <Sticker className="h-3 w-3 text-white" />;
      case "Cancelado":
        return <Ban className="h-3 w-3 text-white" />;
      case "Pendente":
      default:
        return <XCircle className="h-3 w-3 text-white" />;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-primary" />
          Calendário de Serviços
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="glass-button p-2 text-white"
            onClick={() => navigateMonth('prev')}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-white font-medium px-4">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="glass-button p-2 text-white"
            onClick={() => navigateMonth('next')}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-24" />;
          }

          const dayOrders = getServiceOrdersForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={`h-24 p-1 border border-border/20 rounded-lg glass-card transition-all duration-200 hover:border-primary/30 cursor-pointer relative ${
                isCurrentDay ? 'border-primary/50 bg-primary/10' : ''
              }`}
              onClick={() => onDateClick?.(date)}
              data-testid={`calendar-day-${date.getDate()}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`text-sm font-medium ${
                  isCurrentDay ? 'text-primary' : 'text-white'
                }`}>
                  {date.getDate()}
                </div>
                {dayOrders.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-white glass-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDayServices?.(date);
                    }}
                    title="Ver todos os serviços do dia"
                    data-testid={`button-view-day-services-${date.getDate()}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                {dayOrders.slice(0, 2).map((order) => (
                  <div
                    key={order.id}
                    className="text-xs px-1 py-0.5 rounded glass-card cursor-pointer hover:bg-white/10"
                    title={`${order.code} - ${order.type} - ${getTeamName(order.teamId)}`}
                    data-testid={`calendar-order-${order.code}`}
                  >
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                      {getStatusIcon(order.status)}
                      <span className="text-white truncate">#{order.code}</span>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {order.type}
                    </div>
                  </div>
                ))}
                
                {dayOrders.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayOrders.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-muted-foreground">Concluído</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="text-muted-foreground">Pendente</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-muted-foreground">Reagendado</span>
        </div>
      </div>
    </div>
  );
}