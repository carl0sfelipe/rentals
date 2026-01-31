import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, addDays, startOfDay, eachDayOfInterval, addYears } from 'date-fns';
import { PropertyWithEvents, CalendarEvent } from '../../types/calendar';
import { EventBar } from './EventBar';

interface MasterCalendarProps {
  properties?: any[]; // Full property objects from parent
  onEditProperty?: (property: any) => void;
  onClose?: () => void;
}

export const MasterCalendar: React.FC<MasterCalendarProps> = ({ properties = [], onEditProperty, onClose }) => {
  const [data, setData] = useState<PropertyWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date Range Configuration
  const startDate = startOfDay(new Date());
  // Estado para controlar o fim do calendário dinamicamente
  const [displayEndDate, setDisplayEndDate] = useState(addDays(startDate, 30));

  // States for Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ event: CalendarEvent; propertyId: string } | null>(null);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<any | null>(null);
  
  // Refs for scroll synchronization
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const dayWidth = 120;

  // Recalcula os dias sempre que o displayEndDate mudar
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: displayEndDate });
  }, [displayEndDate]);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Busca um intervalo longo (5 anos) para garantir que pegamos tudo
      const fetchEndDate = addYears(startDate, 5);
      
      const response = await fetch(`${apiUrl}/calendar/timeline?startDate=${startDate.toISOString()}&endDate=${fetchEndDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Server error (${response.status})`);
      const result: PropertyWithEvents[] = await response.json();
      
      // Calcula a data máxima baseada nas reservas existentes
      let maxEventDate = addDays(startDate, 30); // Mínimo de 30 dias
      
      result.forEach(prop => {
        prop.events.forEach(evt => {
          const evtEnd = new Date(evt.endDate);
          if (evtEnd > maxEventDate) {
            maxEventDate = evtEnd;
          }
        });
      });

      // Adiciona uma margem de 7 dias após a última reserva
      setDisplayEndDate(addDays(maxEventDate, 7));
      setData(result);
    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Syncs scrolls:
  // 1. Horizontal scroll of Main Grid -> Horizontal scroll of Header
  // 2. Vertical scroll of Main Grid -> Vertical scroll of Left Column (Properties)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (leftColRef.current) {
      leftColRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Navigation Arrows Logic
  const scrollTime = (direction: 'left' | 'right') => {
    if (mainScrollRef.current) {
      const scrollAmount = dayWidth * 7; // Scroll 1 week
      mainScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleEdit = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setSelectedEvent(null);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    const fullProperty = properties.find(p => p.id === propertyId);
    if (fullProperty) {
      setSelectedPropertyDetails(fullProperty);
    } else {
      const timelineProp = data.find(p => p.id === propertyId);
      if (timelineProp) {
        setSelectedPropertyDetails({
          id: timelineProp.id,
          title: timelineProp.name,
          description: 'Detalhes não disponíveis',
          address: '',
          imageUrl: ''
        });
      }
    }
  };

  const handleDeleteClick = () => {
    if (selectedEvent) {
      const property = data.find(p => p.events.some(e => e.id === selectedEvent.id));
      if (property) {
        setDeleteConfirm({ event: selectedEvent, propertyId: property.id });
      }
      setSelectedEvent(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/properties/${deleteConfirm.propertyId}/bookings/${deleteConfirm.event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar: ${response.status}`);
      }

      setDeleteConfirm(null);
      fetchTimeline();
    } catch (err: any) {
      alert(`Erro ao deletar: ${err.message}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const saveEdit = async () => {
    if (!editingEvent) return;

    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const property = data.find(p => p.events.some(e => e.id === editingEvent.id));
      if (!property) return;

      const response = await fetch(`${apiUrl}/properties/${property.id}/bookings/${editingEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: editingEvent.startDate,
          endDate: editingEvent.endDate,
          type: editingEvent.type,
          observations: editingEvent.observations,
          guestCount: editingEvent.guestCount,
          guestsDetail: editingEvent.guestsDetail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar');
      }

      setEditingEvent(null);
      fetchTimeline();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando calendário...</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans relative group">
      {/* HEADER */}
      <div className="flex bg-gray-100 border-b z-30 shadow-sm">
        <div className="w-64 flex-shrink-0 p-4 font-bold border-r bg-gray-200 flex items-center justify-center">
          Propriedades
          <span className="ml-2 bg-gray-300 text-gray-700 text-xs py-0.5 px-2 rounded-full">
            {data.length}
          </span>
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
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Navigation Arrows (Absolute Overlay) */}
        <button 
          onClick={() => scrollTime('left')}
          className="absolute left-64 top-1/2 -translate-y-1/2 z-40 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg border border-gray-200 text-gray-700 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 -ml-5 hover:ml-0 duration-300"
          title="Voltar 1 semana"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <button 
          onClick={() => scrollTime('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-white/80 hover:bg-white p-3 rounded-l-full shadow-lg border-l border-y border-gray-200 text-gray-700 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 mr-[-20px] hover:mr-0 duration-300"
          title="Avançar 1 semana"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
        </button>


        {/* Left Column (Properties) - Hidden Scrollbar, synced via JS */}
        <div 
          ref={leftColRef}
          className="w-64 flex-shrink-0 bg-white border-r z-20 shadow-lg overflow-hidden"
          onWheel={(e) => {
            if (mainScrollRef.current) {
              mainScrollRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          {data.map(property => (
            <div 
              key={`name-${property.id}`} 
              className="h-20 border-b p-4 flex flex-col justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handlePropertyClick(property.id)}
              title="Ver detalhes da propriedade"
            >
              <span className="font-bold text-gray-800 truncate">{property.name}</span>
            </div>
          ))}
        </div>

        {/* Right Column (Grid) - Main Scroll Container */}
        <div 
          ref={mainScrollRef}
          className="flex-1 overflow-auto relative scroll-smooth"
          onScroll={handleScroll}
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

      {/* MODAL DE DETALHES DA PROPRIEDADE */}
      {selectedPropertyDetails && (
        <div className="absolute inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
            <div className="relative h-48 bg-gray-200 flex-shrink-0">
              {selectedPropertyDetails.imageUrl ? (
                <img 
                  src={selectedPropertyDetails.imageUrl} 
                  alt={selectedPropertyDetails.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <button 
                onClick={() => setSelectedPropertyDetails(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPropertyDetails.title}</h2>
              <p className="text-gray-500 mb-4 flex items-center text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {selectedPropertyDetails.address || 'Endereço não informado'}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold">Quartos</p>
                  <p className="text-xl font-bold text-gray-800">{selectedPropertyDetails.bedrooms || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold">Banheiros</p>
                  <p className="text-xl font-bold text-gray-800">{selectedPropertyDetails.bathrooms || '-'}</p>
                </div>
              </div>

              <div className="prose prose-sm text-gray-600 mb-6">
                <p>{selectedPropertyDetails.description}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPropertyDetails(null)} 
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  FECHAR
                </button>
                <button 
                  onClick={() => {
                    if (onEditProperty) {
                      onEditProperty(selectedPropertyDetails);
                    }
                  }} 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  EDITAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE EVENTO */}
      {editingEvent && (
        <div className="absolute inset-0 z-[60] bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className={`p-4 text-white flex justify-between items-center ${
              editingEvent.type === 'RESERVATION' ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              <h3 className="font-black uppercase tracking-widest">Editar {editingEvent.type === 'RESERVATION' ? 'Reserva' : 'Bloqueio'}</h3>
              <button onClick={() => setEditingEvent(null)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Data Início</label>
                  <input 
                    type="date" 
                    value={format(new Date(editingEvent.startDate), 'yyyy-MM-dd')}
                    onChange={(e) => setEditingEvent({...editingEvent, startDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Data Fim</label>
                  <input 
                    type="date" 
                    value={format(new Date(editingEvent.endDate), 'yyyy-MM-dd')}
                    onChange={(e) => setEditingEvent({...editingEvent, endDate: new Date(e.target.value).toISOString()})}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Tipo</label>
                <select 
                  value={editingEvent.type}
                  onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value as 'RESERVATION' | 'BLOCKED' | 'MAINTENANCE'})}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="RESERVATION">Reserva</option>
                  <option value="BLOCKED">Bloqueio</option>
                  <option value="MAINTENANCE">Manutenção</option>
                </select>
              </div>

              {editingEvent.type === 'RESERVATION' && (
                <div>
                  <label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Qtd. Hóspedes</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingEvent.guestCount || 0}
                    onChange={(e) => setEditingEvent({...editingEvent, guestCount: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Observações</label>
                <textarea 
                  value={editingEvent.observations || ''}
                  onChange={(e) => setEditingEvent({...editingEvent, observations: e.target.value})}
                  className="w-full p-2 border rounded-lg text-sm h-24 resize-none"
                  placeholder="Adicione observações..."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3 justify-end">
              <button onClick={() => setEditingEvent(null)} className="px-6 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">CANCELAR</button>
              <button onClick={saveEdit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-red-600 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest">Confirmar Exclusão</h3>
              <button onClick={cancelDelete} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-red-900 font-bold mb-2">⚠️ Tem certeza que deseja excluir este evento?</p>
                <div className="text-sm text-red-700">
                  <p><strong>Tipo:</strong> {deleteConfirm.event.type === 'RESERVATION' ? 'Reserva' : 'Bloqueio/Manutenção'}</p>
                  <p><strong>Data:</strong> {format(new Date(deleteConfirm.event.startDate), 'dd/MM/yyyy')} - {format(new Date(deleteConfirm.event.endDate), 'dd/MM/yyyy')}</p>
                  {deleteConfirm.event.observations && <p><strong>Obs:</strong> {deleteConfirm.event.observations}</p>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3 justify-end">
              <button onClick={cancelDelete} className="px-6 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">CANCELAR</button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">CONFIRMAR EXCLUSÃO</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="p-4 bg-gray-50 flex gap-3 justify-end">
              <button onClick={() => setSelectedEvent(null)} className="px-6 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">FECHAR</button>
              <button onClick={handleEdit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">EDITAR</button>
              <button onClick={handleDeleteClick} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">DELETAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
