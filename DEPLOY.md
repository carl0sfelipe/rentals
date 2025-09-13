# 🚀 DEPLOY GUIDE - Rentals App

## ✅ STATUS: PRONTO PARA PRODUÇÃO

### 📦 **O que temos:**
- ✅ Sistema multi-tenant completo
- ✅ Funcionalidade de imagens automáticas (Unsplash)
- ✅ Frontend React moderno
- ✅ Backend NestJS robusto
- ✅ Banco PostgreSQL com Prisma
- ✅ Autenticação JWT
- ✅ Dockerfiles otimizados
- ✅ Configurações de produção

---

## 🎯 **DEPLOY EM 3 PASSOS:**

### **1️⃣ BACKEND (Railway)**
1. Acesse: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Conecte: `carl0sfelipe/rentals`
4. Branch: `feature/organization-multi-tenant`
5. **Add Database** → **PostgreSQL**

**Variáveis de Ambiente:**
```
DATABASE_URL=postgresql://... (auto-gerada)
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
NODE_ENV=production
CORS_ORIGINS=https://seu-frontend.vercel.app
```

### **2️⃣ FRONTEND (Vercel)**
1. Acesse: https://vercel.com
2. **New Project** → **Import Git Repository**
3. Conecte: `carl0sfelipe/rentals`
4. **Configure Project:**
   - Framework: **Other**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

**Variável de Ambiente:**
```
VITE_API_URL=https://sua-api.up.railway.app
```

### **3️⃣ CONFIGURAÇÃO FINAL**
1. Atualize `CORS_ORIGINS` no Railway com sua URL do Vercel
2. Teste as funcionalidades:
   - Login: admin@test.com / 12345678
   - Criar propriedades
   - Upload de imagens
   - Sistema multi-tenant

---

## 🔗 **URLs DE EXEMPLO:**
- **API:** https://rentals-production-xxxx.up.railway.app
- **Frontend:** https://rentals-frontend.vercel.app

---

## 🛡️ **SEGURANÇA:**
- ✅ JWT_SECRET forte (min 32 caracteres)
- ✅ CORS configurado
- ✅ Validação de dados
- ✅ Containerização segura

---

## 🚨 **TROUBLESHOOTING:**

**Erro de CORS:**
- Verifique CORS_ORIGINS no Railway
- Confirme URL do Vercel

**Erro de Banco:**
- DATABASE_URL correta?
- PostgreSQL ativo no Railway?

**Build falhando:**
- Node.js 20+
- Dependências instaladas
- Schema do Prisma presente

---

## 📞 **SUPORTE:**
- Documentação Railway: https://docs.railway.app
- Documentação Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs

**✨ Sua aplicação estará online em ~5 minutos!**
