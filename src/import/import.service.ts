import { Injectable } from '@nestjs/common';

export interface ParsedBooking {
  source: string;
  propertyName: string;
  guestName: string;
  startDate: string;
  endDate: string;
  originalText: string;
  address?: string;
}

@Injectable()
export class ImportService {
  
  parseData(bookingText: string, airbnbUpcomingText: string, airbnbTodayText: string): ParsedBooking[] {
    const bookingResults = this.parseBooking(bookingText);
    const airbnbUpcomingResults = this.parseAirbnb(airbnbUpcomingText, 'UPCOMING');
    const airbnbTodayResults = this.parseAirbnb(airbnbTodayText, 'TODAY');

    return [...bookingResults, ...airbnbUpcomingResults, ...airbnbTodayResults];
  }

  private parseBooking(text: string): ParsedBooking[] {
    if (!text) return [];
    const results: ParsedBooking[] = [];
    
    const monthMap: { [key: string]: string } = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    };

    const parseDatePT = (str: string) => {
        try {
            const match = str.match(/(\d{1,2})º?\s+de\s+([a-zç\.]+)\.?\s+de\s+(\d{4})/i);
            if (match) {
                const day = match[1].padStart(2, '0');
                const monthStr = match[2].substring(0, 3).toLowerCase();
                const year = match[3];
                return `${year}-${monthMap[monthStr]}-${day}`;
            }
        } catch (e) { return null; }
        return null;
    };

    // Divide o texto em linhas brutas
    const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const chunks: string[][] = [];
    let currentChunk: string[] = [];

    // Estratégia de Chunking baseada no ID da Propriedade (início de nova reserva)
    // O Booking sempre começa a linha da reserva com o ID (ex: "12205094 Ap...")
    const idRegex = /^\d{7,}\b/;

    allLines.forEach(line => {
        if (idRegex.test(line)) {
            // Se já tem um chunk acumulado, salva ele antes de começar o novo
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            currentChunk = [line]; // Começa novo chunk
        } else {
            // Se estamos dentro de um chunk (já passamos por um ID), adiciona a linha
            if (currentChunk.length > 0) {
                currentChunk.push(line);
            }
        }
    });
    // Adiciona o último chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    const BLACKLIST_TERMS = [
        'Filtrar por', 'reservas encontradas', 'Pagamento', 'Comissão', 
        'Imprimir lista', 'Download', 'Status', 'Avaliações', 'Ganhos'
    ];

    chunks.forEach(lines => {
        const fullBlockText = lines.join('\n');
        
        // Extrai datas do bloco inteiro
        const dates: string[] = [];
        const dateMatches = fullBlockText.matchAll(/(\d{1,2})º?\s+de\s+([a-zç\.]+)\.?\s+de\s+(\d{4})/gi);
        for (const m of dateMatches) {
            const parsed = parseDatePT(m[0]);
            if (parsed) dates.push(parsed);
        }

        // Se não tem datas, ignora (pode ser lixo que parecia ID)
        if (dates.length < 2) return;

        // A primeira linha do chunk É o Nome (porque o chunk começou pelo ID)
        let propertyName = lines[0].replace(/^\d+\s+/, '').trim(); // Remove o ID
        
        // O Endereço geralmente é a segunda linha (index 1), a menos que seja algo ignorável
        let address = '';
        if (lines.length > 1) {
            // Procura a linha de endereço nas próximas 3 linhas
            for (let i = 1; i < Math.min(lines.length, 4); i++) {
                const l = lines[i];
                if (
                    (l.includes('Rua') || l.includes('Av.') || l.includes('Belo Horizonte') || l.match(/\d{5}-\d{3}/))
                    &&
                    !l.includes('R$') && !l.match(/\d{1,2}º? de/)
                ) {
                    address = l;
                    break;
                }
            }
        }

        // Hóspede: Procura linha que não é nome, endereço, data, preço
        let guestName = lines.find(l => 
            l !== lines[0] && // Não é a linha do nome
            l !== address &&
            !l.includes('R$') && 
            !l.match(/\d/) && // Hóspede geralmente não tem número
            !BLACKLIST_TERMS.some(term => l.includes(term))
        ) || 'Hóspede Booking';

        results.push({
            source: 'Booking.com',
            propertyName: propertyName,
            guestName: guestName,
            startDate: dates[0],
            endDate: dates[1],
            originalText: fullBlockText,
            address: address || undefined
        });
    });

    return results;
  }

  private parseAirbnb(text: string, type: 'UPCOMING' | 'TODAY'): ParsedBooking[] {
    if (!text) return [];
    const results: ParsedBooking[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const monthMap: { [key: string]: string } = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const dateRangeMatch = line.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s+de\s+([a-zç\.]+)/i);
        
        if (dateRangeMatch) {
            const startDay = dateRangeMatch[1].padStart(2, '0');
            const endDay = dateRangeMatch[2].padStart(2, '0');
            const monthStr = dateRangeMatch[3].substring(0, 3).toLowerCase();
            const month = monthMap[monthStr];
            const currentYear = new Date().getFullYear();
            
            const guestName = lines[i+1];
            const propertyName = lines[i+2];

            if (propertyName && guestName) {
                results.push({
                    source: 'Airbnb',
                    propertyName: propertyName,
                    guestName: guestName,
                    startDate: `${currentYear}-${month}-${startDay}`,
                    endDate: `${currentYear}-${month}-${endDay}`,
                    originalText: line
                });
                i += 3;
                continue;
            }
        } else if (line.includes('Fica mais um dia') || line.includes('Fica por mais')) {
            let guestName = 'Hóspede Airbnb';
            const nameMatch = line.match(/de\s+([^0-9]+?)\s+fica/i);
            if (nameMatch) guestName = nameMatch[1];

            const propertyName = lines[i+1];
            
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let daysRemaining = 1;
            const daysMatch = line.match(/mais\s+(\d+)\s+dias/);
            if (daysMatch) daysRemaining = parseInt(daysMatch[1]);

            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + daysRemaining);

            if (propertyName) {
                results.push({
                    source: 'Airbnb (Hoje)',
                    propertyName: propertyName || 'Desconhecido',
                    guestName: guestName,
                    startDate: yesterday.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    originalText: line
                });
                i += 2;
                continue;
            }
        }
        i++;
    }

    return results;
  }
}