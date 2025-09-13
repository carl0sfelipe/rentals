# Dockerfile multi-stage para aplicação NestJS
# ------------------------------------------------------------
# Defina a versão do Node via build arg para fácil atualização.
ARG NODE_VERSION=20-alpine

# ------------------------------------------------------------
# Stage build: gera artefatos compilados (dist/) para produção
# ------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
ENV NODE_ENV=development
WORKDIR /usr/src/app

# Instalar dependências de sistema
RUN apk add --no-cache bash libc6-compat

# Copiar arquivos de configuração
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma

# Instalar TODAS as dependências (incluindo dev)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Gerar Prisma client
RUN npx prisma generate

# Copiar código fonte
COPY src ./src

# Executar build
RUN npm run build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/ && test -f dist/src/main.js

# ------------------------------------------------------------
# Stage production: imagem final enxuta
# ------------------------------------------------------------
FROM node:${NODE_VERSION} AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Instalar dependências de sistema
RUN apk add --no-cache bash libc6-compat

# Criar usuário não-root
RUN chown -R node:node /usr/src/app

# Copiar arquivos de manifesto e schema do Prisma primeiro
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma

# Instalar apenas dependências de produção + Prisma CLI temporariamente
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm install prisma --no-save \
  && npx prisma generate \
  && npm uninstall prisma \
  && npm cache clean --force

# Copiar o código compilado do stage build
COPY --from=build --chown=node:node /usr/src/app/dist ./dist

# Verificar se os arquivos foram copiados
RUN ls -la dist/ && test -f dist/src/main.js

USER node
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
