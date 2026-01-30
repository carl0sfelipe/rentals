import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { PropertyWithEvents, CalendarEvent } from '../../types/calendar';
import { EventBar } from './EventBar';

export const MasterCalendar: React.FC = () => {
  const [data, setData] = useState<PropertyWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, 29);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dayWidth = 120;

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/calendar/timeline?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Server error (${response.status})`);
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando calendário...</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans relative">
      {/* HEADER */}
      <div className="flex bg-gray-100 border-b z-30 shadow-sm">
        <div className="w-64 flex-shrink-0 p-4 font-bold border-r bg-gray-200 flex items-center justify-center">
          Propriedades
        </div>
        <div ref={headerRef} className="flex overflow-hidden">
          {days.map(day => (
            <div 
              key={day.toString()} 
              className={`flex-shrink-0 p-2 text-center border-r h-16 flex flex-col justify-center ${
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50' : ''
              }`} 
              style={{ width: dayWidth }}
            >
              <div className="text-[10px] text-gray-500 uppercase font-bold">{format(day, 'EEE')}</div>
              <div className="text-sm font-black">{format(day, 'dd/MM')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0 bg-white border-r z-20 shadow-lg overflow-hidden">
          {data.map(property => (
            <div key={`name-${property.id}`} className="h-20 border-b p-4 flex flex-col justify-center bg-white hover:bg-gray-50">
              <span className="font-bold text-gray-800 truncate">{property.name}</span>
              <span className="text-[10px] text-blue-500 font-semibold uppercase">{property.cleanStatus}</span>
            </div>
          ))}
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          <div style={{ width: days.length * dayWidth, minHeight: '100%' }}>
            {data.map(property => (
              <div key={`row-${property.id}`} className="h-20 border-b relative hover:bg-gray-50/50">
                <div className="absolute inset-0 flex">
                  {days.map(day => (
                    <div key={`grid-${property.id}-${day}`} className="h-full border-r border-gray-100/50 flex-shrink-0" style={{ width: dayWidth }} />
                  ))}
                </div>
                <div className="absolute inset-0">
                  {(property.events || []).map(event => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)}>
                      <EventBar event={event} gridStartDate={startDate} dayWidth={dayWidth} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETALHES MODAL (INNER) */}
      {selectedEvent && (
        <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className={`p-4 text-white flex justify-between items-center ${
              selectedEvent.type === 'RESERVATION' ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              <h3 className="font-black uppercase tracking-widest">Detalhes do {selectedEvent.type === 'RESERVATION' ? 'Reserva' : 'Bloqueio'}</h3>
              <button onClick={() => setSelectedEvent(null)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between border-b pb-4 text-gray-800">
                <div>
                  <p className="text-xs uppercase font-bold text-gray-400">Início</p>
                  <p className="font-black text-lg">{format(new Date(selectedEvent.startDate), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase font-bold text-gray-400">Fim</p>
                  <p className="font-black text-lg">{format(new Date(selectedEvent.endDate), 'dd/MM/yyyy')}</p>
                </div>
              </div>

              {selectedEvent.type === 'RESERVATION' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs uppercase font-bold text-blue-400 mb-1">Hóspedes</p>
                    <p className="text-2xl font-black text-blue-900">{selectedEvent.guestCount || 0} Pessoa(s)</p>
                  </div>
                  
                  {/* Mostrar lista de hóspedes se houver dados, mesmo que incompletos */}
                  {selectedEvent.guestsDetail && Array.isArray(selectedEvent.guestsDetail) && selectedEvent.guestsDetail.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase font-bold text-gray-400">Lista de Hóspedes</p>
                      {selectedEvent.guestsDetail.map((guest: any, idx: number) => {
                        // Só mostra o card se pelo menos um dos campos estiver preenchido
                        if (!guest.name && !guest.cpf && !guest.whatsapp) return null;
                        
                        return (
                          <div key={idx} className="bg-gray-50 p-3 rounded border text-sm">
                            <p className="font-bold text-gray-900">{guest.name || 'Nome não informado'}</p>
                            <div className="flex flex-wrap gap-x-4 text-gray-600 text-xs mt-1">
                              {guest.cpf && <span><strong>CPF:</strong> {guest.cpf}</span>}
                              {guest.whatsapp && <span><strong>Whats:</strong> {guest.whatsapp}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.observations && (
                <div>
                  <p className="text-xs uppercase font-bold text-gray-400 mb-1">Observações / Notas</p>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-gray-700 italic">
                    "{selectedEvent.observations}"
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 text-right">
              <button onClick={() => setSelectedEvent(null)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition-colors">FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
