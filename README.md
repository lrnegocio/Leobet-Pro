# LEOBET PRO - Plataforma de Apostas Profissional

Plataforma completa para gestão de Bingos e Bolões de Futebol, com auditoria em tempo real, integração com WhatsApp e suporte a impressão térmica.

## 🚀 Como subir para o GitHub (Passo a Passo)

Abra o terminal na pasta do projeto e execute estes comandos:

```bash
# 1. Iniciar o git local
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o primeiro registro
git commit -m "🚀 Deploy inicial Leobet Pro"

# 4. Criar o branch principal
git branch -M main

# 5. Conectar ao seu repositório oficial
git remote add origin https://github.com/lrnegocio/Leobet-Pro.git

# 6. Enviar para o GitHub
# Quando o terminal pedir o Username: digite lrnegocio
# Quando pedir a Password: COLE O TOKEN QUE VOCÊ GEROU (Classic Token)
git push -u origin main
```

## 📡 Deploy na Vercel
1. Vá para [vercel.com](https://vercel.com).
2. Clique em **"Add New" -> "Project"**.
3. Importe o repositório **Leobet-Pro**.
4. Em **Environment Variables**, adicione as chaves do seu Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.

## 🛠️ Tecnologias
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Banco de Dados**: Supabase (Pronto para migração)
- **Persistência**: LocalStorage (Modo de Alta Performance)

---
© 2026 LEOBET PRO - Sistema Auditado 365 Dias.