import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { CalendarEvent } from '../../types/calendar';

interface EventBarProps {
  event: CalendarEvent;
  gridStartDate: Date;
  dayWidth: number;
}

export const EventBar: React.FC<EventBarProps> = ({ event, gridStartDate, dayWidth }) => {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);
  const offsetDays = differenceInDays(start, gridStartDate);
  const durationDays = differenceInDays(end, start) + 1;
  const leftPos = offsetDays * dayWidth;
  const widthPx = durationDays * dayWidth;

  const colorClass = event.type === 'BLOCKED' ? 'bg-gray-400' : 
                     event.type === 'MAINTENANCE' ? 'bg-red-400' : 'bg-blue-600';

  return (
    <div
      className={`absolute top-2 bottom-2 rounded px-2 text-xs text-white flex items-center overflow-hidden whitespace-nowrap z-10 cursor-pointer hover:brightness-110 shadow-sm ${colorClass}`}
      style={{ left: `${leftPos}px`, width: `${widthPx - 4}px` }}
      title={event.title}
    >
      {event.title}
    </div>
  );
};
