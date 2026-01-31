import React, { useState } from 'react';

// Função de similaridade (Dice's Coefficient)
const compareTwoStrings = (first, second) => {
    if (!first || !second) return 0;
    first = first.replace(/\s+/g, '').toLowerCase();
    second = second.replace(/\s+/g, '').toLowerCase();
    if (first === second) return 1;
    if (first.length < 2 || second.length < 2) return 0;
    const firstBigrams = new Map();
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
        firstBigrams.set(bigram, count);
    }
    let intersectionSize = 0;
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }
    return (2.0 * intersectionSize) / (first.length + second.length - 2);
};

export const ImportWizard = ({ existingProperties, onSave, onClose }) => {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({
    booking: '',
    airbnbUpcoming: '',
    airbnbToday: ''
  });
  const [parsedData, setParsedData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);

  const handleAnalyze = async () => {
    setLoadingAnalyze(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/import/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          bookingText: inputs.booking,
          airbnbUpcomingText: inputs.airbnbUpcoming,
          airbnbTodayText: inputs.airbnbToday
        })
      });

      if (!response.ok) throw new Error('Falha na análise do servidor');
      
      const allData = await response.json();

      const rawGroups = {};
      allData.forEach(item => {
          const key = item.propertyName; 
          if (!rawGroups[key]) {
              rawGroups[key] = {
                  id: `temp_${Object.keys(rawGroups).length}`, 
                  name: item.propertyName,
                  address: item.address || '',
                  bookings: [],
                  targetId: 'NEW', 
                  matchScore: 0,
                  matchReason: ''
              };
          }
          rawGroups[key].bookings.push(item);
          if (item.address && !rawGroups[key].address) {
              rawGroups[key].address = item.address;
          }
      });

      const items = Object.values(rawGroups);

      items.forEach((item, index) => {
          let bestMatch = null;
          let bestScore = 0;
          let matchReason = '';
          let matchType = 'NONE';

          existingProperties.forEach(p => {
              const score = calculateMatchScore(item, p);
              if (score.val > bestScore) {
                  bestScore = score.val;
                  bestMatch = p.id;
                  matchReason = score.reason;
                  matchType = 'EXISTING';
              }
          });

          if (bestScore < 0.8) { 
              for (let i = 0; i < items.length; i++) {
                  if (i === index) continue;
                  const otherItem = items[i];
                  const otherAsProp = { title: otherItem.name, address: otherItem.address };
                  const score = calculateMatchScore(item, otherAsProp);
                  
                  if (score.val > bestScore) {
                      bestScore = score.val;
                      bestMatch = `LINK:${otherItem.id}`;
                      matchReason = `Similar a "${otherItem.name}"`;
                      matchType = 'SELF';
                  }
              }
          }

          if (bestScore > 0.6) {
              item.targetId = bestMatch;
              item.matchScore = bestScore;
              item.matchReason = `${matchReason} (${Math.round(bestScore*100)}%)`;
          }
      });

      setParsedData(items);
      setStep(2);
    } catch (error) {
      alert(`Erro ao analisar textos: ${error.message}`);
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const calculateMatchScore = (item, target) => {
      const titleScore = compareTwoStrings(item.name, target.title);
      if (item.address && target.address) {
          const addressScore = compareTwoStrings(item.address, target.address);
          if (addressScore > 0.9) return { val: Math.max(titleScore, 0.95), reason: 'Endereço idêntico' };
          if (addressScore > 0.7) return { val: (titleScore + addressScore) / 2, reason: 'Endereço similar' };
      }
      return { val: titleScore, reason: 'Nome similar' };
  };

  const handleProcessImport = async () => {
    setStep(3);
    setLogs([]);
    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    addLog('🚀 Iniciando processamento...');

    const resolvedIds = {}; // temp_id -> real_uuid

    // PASSO 1: Criar novas propriedades e mapear existentes
    for (const item of parsedData) {
        if (item.targetId === 'SKIP') continue;

        if (item.targetId === 'NEW') {
            addLog(`🏠 Criando: ${item.name}...`);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/properties`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        title: item.name,
                        description: item.address ? `Localização: ${item.address}` : 'Importada via Dashboard',
                        address: item.address,
                        pricePerNight: 0, bedrooms: 1, bathrooms: 1
                    })
                });
                const newProp = await response.json();
                resolvedIds[item.id] = newProp.id;
                addLog(`✅ Criada!`);
            } catch (e) {
                addLog(`❌ Erro ao criar ${item.name}`);
            }
        } else if (!item.targetId.startsWith('LINK:')) {
            // É um ID real do banco
            resolvedIds[item.id] = item.targetId;
            addLog(`🔗 Vinculado a existente: ${item.name}`);
        }
    }

    // PASSO 2: Processar itens que são LINKs
    // (Pode haver chains, então repetimos até resolver tudo ou atingir limite)
    let iterations = 0;
    const itemsToLink = parsedData.filter(i => i.targetId.startsWith('LINK:'));
    
    while (iterations < 3) { // Limite de profundidade de link
        let resolvedInThisRound = 0;
        itemsToLink.forEach(item => {
            if (resolvedIds[item.id]) return; // Já resolveu
            const targetTempId = item.targetId.split(':')[1];
            if (resolvedIds[targetTempId]) {
                resolvedIds[item.id] = resolvedIds[targetTempId];
                resolvedInThisRound++;
                addLog(`🔄 Unindo "${item.name}" -> "${resolvedIds[item.id].split('-')[0]}..."`);
            }
        });
        if (resolvedInThisRound === 0) break;
        iterations++;
    }

    // PASSO 3: Criar as Reservas
    addLog('📅 Agendando reservas...');
    for (const item of parsedData) {
        const realId = resolvedIds[item.id];
        if (!realId) continue;

        for (const booking of item.bookings) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/properties/${realId}/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        startDate: booking.startDate,
                        endDate: booking.endDate,
                        type: 'RESERVATION',
                        observations: `Importado de ${booking.source}`,
                        guestCount: 1,
                        guestsDetail: [{ name: booking.guestName }]
                    })
                });
            } catch (e) {}
        }
    }

    addLog('🏁 Concluído com sucesso!');
    setTimeout(() => onSave(), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4 font-sans">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📥</span>
            <h2 className="text-xl font-bold tracking-tight">IMPORTAÇÃO INTELIGENTE EM MASSA</h2>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {[
                        { id: 'booking', label: 'Booking.com', icon: '🏨' },
                        { id: 'airbnbUpcoming', label: 'Airbnb (Próximos)', icon: '📅' },
                        { id: 'airbnbToday', label: 'Airbnb (Hoje)', icon: '🏠' }
                    ].map(field => (
                        <div key={field.id} className="flex flex-col bg-white p-4 rounded-lg border shadow-sm">
                            <label className="font-bold mb-2 text-gray-700 flex items-center gap-2">
                                <span>{field.icon}</span> {field.label}
                            </label>
                            <textarea 
                                className="flex-1 border-2 border-gray-100 p-3 rounded-lg resize-none text-[10px] font-mono focus:border-blue-400 focus:ring-0 outline-none transition-colors"
                                placeholder={`Cole o texto completo da página do ${field.label} aqui...`}
                                value={inputs[field.id]}
                                onChange={e => setInputs({...inputs, [field.id]: e.target.value})}
                            />
                        </div>
                    ))}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">📋 Revisar e Mesclar Propriedades</h3>
                        <p className="text-sm text-gray-500">{parsedData.length} anúncios detectados</p>
                    </div>
                    
                    {parsedData.map((group, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-blue-900 truncate">{group.name}</h4>
                                    {group.matchScore > 0 && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black border border-green-200 uppercase tracking-tighter">
                                            {group.matchReason}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 italic">
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {group.address || 'Origem Airbnb (Sem Endereço)'}
                                </div>
                            </div>

                            <div className="w-full md:w-[450px]">
                                <select 
                                    className={`w-full p-2.5 text-sm rounded-lg border-2 font-bold transition-all focus:ring-4 focus:ring-blue-100 outline-none ${
                                        group.targetId === 'NEW' ? 'border-blue-100 bg-white text-blue-600' : 
                                        group.targetId.startsWith('LINK:') ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                        'border-green-200 bg-green-50 text-green-700'
                                    }`}
                                    value={group.targetId}
                                    onChange={(e) => {
                                        const newData = [...parsedData];
                                        newData[idx].targetId = e.target.value;
                                        setParsedData(newData);
                                    }}
                                >
                                    <option value="NEW">✨ CRIAR COMO NOVA PROPRIEDADE</option>
                                    <option value="SKIP">🚫 IGNORAR ESTE ANÚNCIO</option>
                                    
                                    {existingProperties.length > 0 && (
                                        <optgroup label="VINCULAR A PROPRIEDADE NO SISTEMA">
                                            {existingProperties.map(p => (
                                                <option key={p.id} value={p.id}>🔗 {p.title}</option>
                                            ))}
                                        </optgroup>
                                    )}

                                    <optgroup label="UNIR COM OUTRO ITEM DESTA LISTA">
                                        {parsedData.map((other, otherIdx) => {
                                            if (otherIdx === idx) return null;
                                            return (
                                                <option key={other.id} value={`LINK:${other.id}`}>
                                                    🔄 MESCLAR COM: {other.name}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {step === 3 && (
                <div className="bg-slate-900 text-emerald-400 font-mono p-6 rounded-xl h-full overflow-y-auto text-xs leading-relaxed shadow-inner">
                    {logs.map((log, i) => <div key={i} className="mb-1 border-b border-slate-800 pb-1">{log}</div>)}
                    <div className="animate-pulse">_</div>
                </div>
            )}

        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between gap-4">
            {step === 1 && (
                <>
                    <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">CANCELAR</button>
                    <button 
                        onClick={handleAnalyze} 
                        className="px-10 py-3 bg-blue-600 text-white rounded-lg font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                        disabled={loadingAnalyze || (!inputs.booking && !inputs.airbnbUpcoming && !inputs.airbnbToday)}
                    >
                        {loadingAnalyze ? '⚙️ PROCESSANDO TEXTOS...' : 'ANALISAR DADOS ➡️'}
                    </button>
                </>
            )}
            {step === 2 && (
                <>
                    <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">⬅️ VOLTAR</button>
                    <button 
                        onClick={handleProcessImport} 
                        className="px-12 py-3 bg-emerald-600 text-white rounded-lg font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                    >
                        CONFIRMAR E IMPORTAR ✅
                    </button>
                </>
            )}
            {step === 3 && <div className="w-full text-center font-black text-blue-600 animate-bounce">IMPORTANDO...</div>}
        </div>

      </div>
    </div>
  );
};