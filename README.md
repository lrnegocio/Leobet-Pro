# LEOBET PRO - Plataforma de Apostas Profissional

Plataforma completa para gestão de Bingos e Bolões de Futebol, com auditoria em tempo real, integração com WhatsApp e suporte a impressão térmica.

## 🚀 Como subir para o GitHub e Vercel

Siga estes passos no terminal da sua pasta do projeto:

### 1. Iniciar o Repositório Local
```bash
git init
git add .
git commit -m "🚀 Initial deploy Leobet Pro"
```

### 2. Conectar ao GitHub (Substitua pelo seu link do repo)
```bash
git remote add origin https://github.com/SEU_USUARIO/Leobet-Pro.git
git branch -M main
git push -u origin main
```

### 3. Deploy na Vercel
1. Vá para [vercel.com](https://vercel.com) e clique em **"Add New" -> "Project"**.
2. Importe o repositório **Leobet-Pro**.
3. Em **Environment Variables**, adicione as chaves do seu Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**.

## 🛠️ Tecnologias
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Database/Auth**: Supabase (Pronto para integração)
- **Persistence**: LocalStorage (Modo Mock de Alta Performance)

## 📡 Integrações
- **WhatsApp**: Envio de comprovantes automáticos com palpites detalhados.
- **Impressão**: Formatação otimizada para impressoras térmicas Bluetooth 58mm.
- **PWA**: Instalável em Android e iOS.

---
© 2026 LEOBET PRO - Sistema Auditado 365 Dias.