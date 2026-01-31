# 🤖 Guia para LLMs - Rental Property Management System

> Como usar o contexto do projeto para diferentes cenários de desenvolvimento

## 📋 Contexto Base

**Sempre inclua esta informação inicial em seus prompts:**

```
Este é um sistema completo de gestão de propriedades para aluguel construído com:
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Frontend: React + TypeScript + Vite
- Testes: 47/47 passando (100% coverage) com Vitest + Supertest
- Deploy: Docker Compose
- Status: Production Ready

Funcionalidades principais:
✅ CRUD de propriedades
✅ Sistema de reservas/bloqueios com validação
✅ Exportação de calendários iCalendar (.ics)
✅ Autenticação JWT completa
✅ Separação de ambientes (dev/test/prod)
```

## 🎯 Cenários de Uso Comuns

### 1. 🆕 Adicionar Nova Funcionalidade

**Prompt Exemplo:**
```
Contexto: [Cole aqui o PROJECT_CONTEXT.md completo]

Tarefa: Preciso adicionar um sistema de avaliações/reviews para as propriedades.

Requisitos:
- Usuários podem avaliar propriedades (1-5 estrelas)
- Comentários opcionais
- Apenas quem fez reserva pode avaliar
- Média de avaliações na listagem

Como implementar seguindo a arquitetura atual?
```

### 2. 🐛 Corrigir Bugs

**Prompt Exemplo:**
```
Contexto: [Cole o PROJECT_CONTEXT.md]

Problema: Os testes E2E estão falhando com erro "Cannot read properties of undefined"

Erro específico:
[Cole aqui o log de erro]

Como diagnosticar e corrigir mantendo os 47/47 testes passando?
```

### 3. 🚀 Otimização de Performance

**Prompt Exemplo:**
```
Contexto: [Cole o PROJECT_CONTEXT.md]

Objetivo: Otimizar a performance das consultas de propriedades

Cenário atual:
- 1000+ propriedades no banco
- Listagem lenta (>2s)
- Filtros por localização e preço

Como implementar paginação, índices e cache seguindo as boas práticas atuais?
```

### 4. 🧪 Adicionar Novos Testes

**Prompt Exemplo:**
```
Contexto: [Cole o PROJECT_CONTEXT.md]

Tarefa: Criar testes para uma nova funcionalidade de notificações por email

Requisitos:
- Manter 100% de coverage
- Seguir padrão dos testes existentes (Vitest + Supertest)
- Testes unitários + E2E
- Mocks para serviço de email

Como estruturar os testes seguindo o padrão atual?
```

### 5. 🐳 Deploy e DevOps

**Prompt Exemplo:**
```
Contexto: [Cole o PROJECT_CONTEXT.md]

Objetivo: Fazer deploy em produção

Requisitos:
- AWS/DigitalOcean
- CI/CD com GitHub Actions
- Ambiente de produção separado
- Monitoramento e logs

Como configurar seguindo a estrutura Docker atual?
```

### 6. 🔧 Refatoração de Código

**Prompt Exemplo:**
```
Contexto: [Cole o PROJECT_CONTEXT.md]

Tarefa: Refatorar o serviço de autenticação para usar refresh tokens

Cenário atual:
- JWT simples com expiração
- Re-login manual necessário

Como implementar refresh tokens mantendo compatibilidade com o frontend atual?
```

## 📚 Templates de Prompt por Tipo

### 🏗️ Arquitetura e Design
```
Contexto: [PROJECT_CONTEXT.md]

Pergunta: Como reestruturar [componente específico] para melhor [objetivo]?

Considerações:
- Manter compatibilidade com a API atual
- Seguir padrões NestJS/React existentes
- Não quebrar os testes atuais
- [requisitos específicos]
```

### 🔍 Análise de Código
```
Contexto: [PROJECT_CONTEXT.md]

Tarefa: Revisar o arquivo [nome do arquivo] e sugerir melhorias

Foco em:
- Performance
- Segurança
- Manutenibilidade
- Testes
- [aspectos específicos]
```

### 📖 Documentação
```
Contexto: [PROJECT_CONTEXT.md]

Objetivo: Criar documentação para [funcionalidade/API/processo]

Audiência: [desenvolvedores/usuários finais/DevOps]
Formato: [README/API docs/tutorial/guia]
Incluir: [exemplos/diagramas/código]
```

### 🔄 Integração
```
Contexto: [PROJECT_CONTEXT.md]

Tarefa: Integrar com [serviço externo/API/sistema]

Requisitos:
- Manter a arquitetura atual
- Adicionar testes apropriados
- Tratamento de erros robusto
- [requisitos específicos]
```

## 💡 Dicas para Melhores Resultados

### ✅ Boas Práticas

1. **Seja Específico**: Inclua logs de erro, código relevante, e requisitos exatos
2. **Contexto Completo**: Sempre cole o PROJECT_CONTEXT.md completo
3. **Padrões Atuais**: Peça para seguir os padrões já estabelecidos no projeto
4. **Testes**: Sempre mencione a necessidade de manter/adicionar testes
5. **Compatibilidade**: Especifique o que deve ser mantido funcionando

### ❌ Evite

1. **Prompts Vagos**: "Melhore o código" sem especificar o que
2. **Contexto Parcial**: Colar apenas parte da documentação
3. **Ignorar Testes**: Não mencionar os 47 testes existentes
4. **Breaking Changes**: Pedir mudanças que quebrem a API atual
5. **Tecnologias Diferentes**: Sugerir mudanças radicais de stack

## 🎭 Exemplos de Prompts Avançados

### Análise Arquitetural Completa
```
Contexto: [PROJECT_CONTEXT.md completo]

Cenário: O sistema cresceu para 10.000+ propriedades e 100.000+ usuários

Análise solicitada:
1. Identificar gargalos atuais na arquitetura
2. Sugerir melhorias para escalabilidade
3. Plano de migração sem downtime
4. Estimativa de esforço e recursos

Considerações:
- Manter a stack atual (NestJS/React/PostgreSQL)
- Budget limitado para infraestrutura
- Time de 2 desenvolvedores
- Timeline de 3 meses
```

### Debug Avançado
```
Contexto: [PROJECT_CONTEXT.md + logs de erro]

Problema: Performance degradada após deploy

Sintomas:
- Tempo de resposta 10x maior
- CPU 100% no container
- Memória crescendo constantemente
- [logs específicos]

Debug necessário:
1. Identificar root cause
2. Solução imediata (hotfix)
3. Solução definitiva
4. Prevenção futura
```

## 🚀 Fluxo de Desenvolvimento Recomendado

1. **Análise** - Entender o problema/requisito completamente
2. **Design** - Planejar solução seguindo padrões existentes
3. **Implementação** - Código seguindo convenções do projeto
4. **Testes** - Manter/expandir cobertura de testes
5. **Documentação** - Atualizar docs relevantes
6. **Review** - Verificar impacto e compatibilidade

---

**💡 Lembre-se:** Este projeto tem 100% de cobertura de testes e está production-ready. Qualquer mudança deve manter essa qualidade!

**📧 Contato:** carlos.felipe@hotmail.com.br para dúvidas específicas
