# Dockerfile para o frontend React
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências (usa npm install se não tiver package-lock.json)
RUN npm install

# Copia o código da aplicação
COPY . .

# Expõe a porta do Vite
EXPOSE 5173

# Comando para desenvolvimento (com hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
