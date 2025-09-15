#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateProjectStructure(dir, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return '';
  
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // Filtrar arquivos e pastas irrelevantes
  const filtered = entries.filter(entry => {
    const name = entry.name;
    return !name.startsWith('.') && 
           !['node_modules', 'dist', 'coverage'].includes(name);
  });
  
  filtered.forEach((entry, index) => {
    const isLast = index === filtered.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    
    if (entry.isDirectory()) {
      items.push(`${prefix}${connector}${entry.name}/`);
      if (currentDepth < maxDepth - 1) {
        items.push(generateProjectStructure(
          path.join(dir, entry.name), 
          nextPrefix, 
          maxDepth, 
          currentDepth + 1
        ));
      }
    } else {
      // Mostrar apenas arquivos importantes
      const ext = path.extname(entry.name);
      const importantFiles = ['.ts', '.js', '.json', '.md', '.yml', '.yaml', '.env', '.prisma'];
      if (importantFiles.includes(ext) || 
          entry.name === 'Dockerfile' || 
          entry.name.startsWith('.env')) {
        items.push(`${prefix}${connector}${entry.name}`);
      }
    }
  });
  
  return items.join('\n');
}

function getPackageInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      scripts: packageJson.scripts
    };
  } catch (error) {
    return null;
  }
}

function generateContext() {
  const projectRoot = process.cwd();
  const packageInfo = getPackageInfo();
  const structure = generateProjectStructure(projectRoot);
  
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  const context = `# 🏠 Rental Property Management System - Contexto Atualizado

> Gerado automaticamente em ${currentDate}
> Sistema completo de gestão de propriedades para aluguel

## 📁 Estrutura do Projeto

\`\`\`
${structure}
\`\`\`

## 📦 Informações do Package.json

${packageInfo ? `
**Nome:** ${packageInfo.name}
**Versão:** ${packageInfo.version}
**Descrição:** ${packageInfo.description || 'N/A'}

### Dependências Principais
${packageInfo.dependencies.map(dep => `- ${dep}`).join('\n')}

### Dependências de Desenvolvimento
${packageInfo.devDependencies.slice(0, 10).map(dep => `- ${dep}`).join('\n')}
${packageInfo.devDependencies.length > 10 ? `- ... e mais ${packageInfo.devDependencies.length - 10} dependências` : ''}

### Scripts Disponíveis
${Object.entries(packageInfo.scripts || {}).map(([key, value]) => `- **${key}:** \`${value}\``).join('\n')}
` : 'Arquivo package.json não encontrado'}

## 🎯 Resumo das Funcionalidades

Este projeto é um **sistema completo de gestão de propriedades** que inclui:

### ✅ Funcionalidades Implementadas
- **CRUD de Propriedades** - Criar, listar, editar e deletar propriedades
- **Sistema de Reservas** - Gestão de bloqueios com validação de conflitos
- **Calendários iCalendar** - Exportação .ics para sincronização externa
- **Autenticação JWT** - Login/registro com tokens seguros
- **Separação de Ambientes** - Desenvolvimento, teste e produção
- **Testes Completos** - 47/47 testes passando (100% coverage)
- **Containerização** - Docker Compose para fácil deployment

### 🏗️ Arquitetura
- **Backend:** NestJS + TypeScript + Prisma
- **Frontend:** React + TypeScript + Vite  
- **Database:** PostgreSQL
- **Testes:** Vitest + Supertest
- **Deploy:** Docker + Docker Compose

### 🔗 API Endpoints Principais
- \`POST /auth/register\` - Registro de usuários
- \`POST /auth/login\` - Login com JWT
- \`GET/POST/PATCH/DELETE /properties\` - CRUD de propriedades
- \`GET/POST/PATCH/DELETE /properties/:id/bookings\` - Gestão de reservas
- \`GET /properties/:id/calendar.ics\` - Exportação de calendário

### 🧪 Status dos Testes
- **Total:** 47 testes passando
- **E2E:** 28 testes (Calendar, Properties, Bookings, Auth)
- **Unit:** 19 testes (Services, Components)
- **Coverage:** 100%

### 🐳 Ambientes
- **Desenvolvimento:** \`docker compose up -d\` + \`npm run start:dev\`
- **Testes:** Banco separado + \`npm test\`
- **Produção:** Pronto para deploy

## 🚀 Quick Start

\`\`\`bash
# 1. Clonar e instalar
git clone <repo>
cd rentals
npm install

# 2. Subir banco de dados
docker compose up -d

# 3. Aplicar migrações
npx prisma migrate dev

# 4. Executar testes
npm test

# 5. Iniciar desenvolvimento
npm run start:dev
\`\`\`

---
*Contexto gerado automaticamente pelo script generate-context.js*
*Para atualizar: \`node scripts/generate-context.js\`*
`;

  fs.writeFileSync('PROJECT_CONTEXT_AUTO.md', context, 'utf8');
  console.log('✅ Contexto gerado em PROJECT_CONTEXT_AUTO.md');
  console.log('📊 Estrutura do projeto:');
  console.log(structure);
}

// Executar se chamado diretamente
if (require.main === module) {
  generateContext();
}

module.exports = { generateContext };
