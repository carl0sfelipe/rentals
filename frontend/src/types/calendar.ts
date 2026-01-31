export type EventType = 'RESERVATION' | 'BLOCKED' | 'MAINTENANCE';
export interface CalendarEvent {
  id: string;
  type: EventType;
  startDate: string;
  endDate: string;
  title: string;
  status?: string;
  observations?: string;
  guestCount?: number;
  guestsDetail?: any[];
}
export interface PropertyWithEvents {
  id: string;
  name: string;
  cleanStatus: string;
  events: CalendarEvent[];
}
