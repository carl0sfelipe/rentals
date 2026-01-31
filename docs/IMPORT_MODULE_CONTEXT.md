# Contexto Técnico: Módulo de Importação e Calendário (Jan/2026)

Este documento descreve a implementação da funcionalidade de "Importação em Massa" (Booking/Airbnb) e as melhorias no Calendário Master.

## 1. Arquitetura da Importação

A solução foi dividida em **Backend (Parsing Pesado)** e **Frontend (Interface e Decisão)** para garantir performance e manutenibilidade.

### Backend (`rentals/src/import`)

*   **Módulo:** `ImportModule`
*   **Controller:** `ImportController` (`POST /import/parse`)
*   **Service:** `ImportService`

#### Lógica de Parsing (Heurísticas)

O serviço recebe textos brutos (copiar/colar) e os processa com estratégias diferentes por plataforma:

1.  **Booking.com (Estratégia "Chunking por ID")**:
    *   Identifica o início de uma reserva ao encontrar um ID numérico longo (ex: `12205094...`) no início de uma linha.
    *   Agrupa todas as linhas subsequentes até o próximo ID.
    *   **Extração:**
        *   **Nome:** Primeira linha do bloco (removendo o ID).
        *   **Endereço:** Busca nas linhas seguintes por palavras-chave (`Rua`, `Av`, `Belo Horizonte`) ou formato de CEP.
        *   **Validação:** O bloco é descartado se não contiver um preço (`R$`) ou um ID válido, evitando "lixo" de UI (filtros, rodapés).

2.  **Airbnb (Estratégia "Line Scanning")**:
    *   Itera linha por linha procurando padrões de data (ex: `2 – 5 de fev.`).
    *   Assume que a estrutura visual é fixa: Data -> Hóspede -> Nome da Propriedade.
    *   **Nota:** O Airbnb não exibe o endereço completo na lista "Hoje/Próximos", então o campo `address` retorna vazio/undefined.

### Frontend (`ImportWizard.jsx`)

Componente React responsável pela UX da importação e resolução de conflitos.

#### Fluxo de Trabalho
1.  **Input:** Usuário cola textos do Booking, Airbnb (Próximos) e Airbnb (Hoje).
2.  **Análise:** Envia textos para o Backend (`/import/parse`).
3.  **Review & Merge (Onde a mágica acontece):**
    *   O frontend recebe a lista "bruta" do backend.
    *   **Agrupamento Inicial:** Agrupa itens com nomes idênticos da mesma origem.
    *   **Sugestão de Vínculo (Auto-Matching):**
        *   Usa o algoritmo **Dice's Coefficient** para comparar similaridade de strings.
        *   **Peso do Endereço:** Se ambos têm endereço, a similaridade de endereço tem peso alto (> 0.9 = match quase certo).
        *   **Peso do Nome:** Se não há endereço (Airbnb), confia na similaridade do nome (> 0.8).
    *   **Self-Reference Matching:** Permite que um item da lista seja vinculado a *outro item da mesma lista* (ex: unir o anúncio do Airbnb ao do Booking que está sendo criado agora).
4.  **Processamento:**
    *   Resolve a ordem de criação (primeiro cria as propriedades "NEW").
    *   Resolve os IDs dos vínculos ("LINK:temp_id" -> "real_uuid").
    *   Cria as reservas associadas.

## 2. Master Calendar (`MasterCalendar.tsx`)

O calendário foi refatorado para performance e usabilidade.

*   **Scroll Sync:** A coluna de propriedades (esquerda) e a grid de datas (direita) têm rolagens sincronizadas via `ref` e eventos de `scroll`/`wheel`.
*   **Carregamento Dinâmico:**
    *   Busca dados de um período longo (5 anos).
    *   Calcula dinamicamente a data final baseada na *última reserva real encontrada*.
    *   Renderiza colunas apenas até essa data (+ margem de segurança), evitando renderizar anos vazios desnecessariamente.
*   **UI:** Contadores de propriedades, setas de navegação lateral e modais de detalhes integrados.

## 3. Comandos Úteis

*   **Resetar Dados de Teste:**
    ```bash
    docker compose exec api npx ts-node scripts/reset-karina.ts
    ```
    *(Apaga propriedades e reservas do usuário karinaafm@gmail.com para testar importação limpa)*

## 4. Manutenção Futura

*   **Mudança no Layout do Booking/Airbnb:** Ajustar apenas `ImportService` no backend. O frontend não precisa mudar.
*   **Ajuste de Sensibilidade de Match:** Alterar os thresholds (0.8, 0.9) no `ImportWizard.jsx` dentro da função `handleAnalyze`.
