# Dockerfile multi-stage para aplicação NestJS
# ------------------------------------------------------------
# Objetivos:
# 1. Fornecer um ambiente de desenvolvimento (hot reload) usando o target "development".
# 2. Gerar uma imagem de produção minimalista, copiando apenas artefatos necessários.
# 3. Maximizar cache de camadas (dependências) e segurança (rodar como usuário não-root).
# ------------------------------------------------------------

# Defina a versão do Node via build arg para fácil atualização.
ARG NODE_VERSION=20-alpine

# Stage base: configurações comuns (diretório, usuário, etc.)
FROM node:${NODE_VERSION} AS base
# Defina diretório de trabalho dentro do container
WORKDIR /usr/src/app
# Instala dependências de SO úteis (remova se não precisar de build nativo)
RUN apk add --no-cache bash libc6-compat
# Cria usuário não-root (o Alpine já traz usuário node em imagens oficiais, garantimos dono)
RUN chown -R node:node /usr/src/app
USER node

# ------------------------------------------------------------
# Stage development: dependências completas + hot reload
# ------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development

# Copiamos apenas arquivos de manifesto primeiro para otimizar cache de dependências
# (Se usar yarn ou pnpm, adapte as linhas abaixo.)
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
# Instala TODAS as dependências (inclui devDependencies)
# npm ci falha se não existir package-lock.json; ajuste para "npm install" se preferir.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi \
  && npx prisma generate || echo "(warn) prisma generate skipped"

# Copia restante do código (TypeScript, config, etc.)
# Em desenvolvimento via docker-compose montaremos volume, então esta cópia é fallback.
COPY --chown=node:node . .

# Expõe a porta padrão NestJS (ajuste se diferente)
EXPOSE 3000

# Comando padrão (pode ser sobrescrito no docker-compose)
# Requer script "start:dev" no package.json (ex: nest start --watch)
CMD ["npm", "run", "start:dev"]

# ------------------------------------------------------------
# Stage build: gera artefatos compilados (dist/) para produção
# ------------------------------------------------------------
FROM development AS build
# Define variáveis que algumas libs usam para otimização
ENV NODE_ENV=production
# Executa build (requer script "build" configurado: nest build)
RUN npm run build && ls -la dist/

# ------------------------------------------------------------
# Stage production: imagem final enxuta
# ------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production

# Copiar arquivos de manifesto e schema do Prisma primeiro
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma

# Instalar dependências de produção + Prisma CLI temporariamente
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm install prisma --no-save \
  && npx prisma generate \
  && npm uninstall prisma \
  && npm cache clean --force

# Copiamos somente a pasta dist do stage build (código transpilado).
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
# (Opcional) Copiar arquivos de configuração necessários em runtime (ex: migrations, .env.sample)
# COPY --from=build --chown=node:node /usr/src/app/prisma ./prisma

USER node
EXPOSE 3000

# Saúde básica (ajuste o endpoint /health conforme implementar)
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]

# ------------------------------------------------------------
# Dicas de uso:
# Desenvolvimento: docker compose up --build
# Produção (build local): docker build -t myapp:prod --target production .
# ------------------------------------------------------------
