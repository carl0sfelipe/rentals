# Post-Mortem: Implementação do Master Calendar e Deploy em Produção

## 📝 O que aconteceu?
Durante a implementação do Módulo de Calendário, o sistema de produção (Droplet) ficou fora do ar com erros **502 Bad Gateway** e falhas de conexão após um `git pull` da branch `main`.

## ❌ Pontos de Falha (Causas Raízes)

### 1. Conflito de Configuração de Proxy (Nginx)
*   **Erro:** O arquivo `nginx.conf` no repositório continha nomes de containers genéricos (`api-prod`). 
*   **Impacto:** Ao dar `pull`, a configuração específica do servidor (que usava `127.0.0.1:3000` ou `rentals_api`) foi sobrescrita, quebrando o "ponteiro" que levava o tráfego do domínio `sslip.io` para a API.

### 2. Localização das Configurações no Ubuntu
*   **Erro:** O Nginx do Ubuntu estava configurado para ler arquivos em `/etc/nginx/sites-enabled/`, mas as edições estavam sendo feitas apenas no arquivo local da pasta do projeto `~/rentals/nginx.conf`.
*   **Impacto:** As correções feitas no arquivo do projeto não surtiam efeito real no servidor, mantendo o erro 502 ativo.

### 3. Sincronização do Motor de Banco de Dados (Prisma)
*   **Erro:** Novos campos (`guestCount`, `observations`) foram adicionados ao schema, mas o comando `npx prisma db push` não foi executado imediatamente no servidor de produção.
*   **Impacto:** A API tentava salvar dados em colunas inexistentes, gerando erros 500 internos.

### 4. Payload Incompleto no Frontend
*   **Erro:** A função de serviço da API no React não enviava os novos campos no corpo da requisição POST/PATCH.
*   **Impacto:** Os dados eram coletados no formulário mas "jogados fora" antes do envio, resultando em valores zerados no calendário.

## 🛡️ Como evitar que se repita?

1.  **Branch de Produção (`prod`):** Manter uma branch separada que contenha as configurações específicas de rede e infraestrutura do Droplet. Nunca dar `pull` da `main` diretamente em produção sem revisar o `nginx.conf`.
2.  **Checklist de Deploy:**
    *   `git pull`
    *   `docker compose up -d --build`
    *   `docker compose exec api npx prisma db push`
    *   `systemctl restart nginx`
3.  **Logs de Auditoria:** Manter os logs de `[DEBUG CALENDAR]` ativos por um tempo para garantir que a integridade dos dados salvos no banco seja mantida.
4.  **Configuração via Variáveis de Ambiente:** Mover nomes de serviços e portas do Nginx para variáveis de ambiente sempre que possível, evitando editar arquivos de configuração manualmente.

---
*Relatório gerado em 30/01/2026 após estabilização do ambiente.*
