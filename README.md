
# LEOBET PRO - Plataforma de Apostas Profissional

Plataforma completa para gestão de Bingos e Bolões de Futebol, com auditoria em tempo real, integração com WhatsApp e suporte a impressão térmica.

## 🚀 Como subir para o GitHub (Passo a Passo Corrigido)

Como você já tem um repositório configurado, execute estes comandos no terminal para corrigir a URL e enviar os arquivos:

```bash
# 1. Corrigir a URL do repositório (Já que o 'origin' já existe)
git remote set-url origin https://github.com/lrnegocio/Leobet-Pro.git

# 2. Adicionar todos os novos arquivos
git add .

# 3. Criar o registro das alterações
git commit -m "🚀 Deploy inicial Leobet Pro"

# 4. Definir a branch principal como main
git branch -M main

# 5. Enviar para o GitHub
# Quando pedir o Username: digite lrnegocio
# Quando pedir a Password: COLE O TOKEN QUE VOCÊ GEROU (Classic Token)
git push -u origin main -f
```

## 📡 Configuração na Vercel
1. Vá para [vercel.com](https://vercel.com).
2. Clique em **"Add New" -> "Project"**.
3. Importe o repositório **Leobet-Pro**.
4. Em **Environment Variables**, adicione as chaves do seu Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://sjlnkpqmfmajszcqlguv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_wynH5nejXXQJrRWnXfsNag_zPPOG9JS`
5. Clique em **Deploy**.

## 🛠️ Tecnologias
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Banco de Dados**: Supabase (Pronto para migração)
- **Persistência**: LocalStorage (Modo de Alta Performance)

---
© 2026 LEOBET PRO - Sistema Auditado 365 Dias.
