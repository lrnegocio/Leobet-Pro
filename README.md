# LEOBET PRO - Plataforma de Apostas Profissional

Plataforma completa para gestão de Bingos e Bolões de Futebol, com auditoria em tempo real, integração com WhatsApp e suporte a impressão térmica.

## 🚀 Como subir para o GitHub e Vercel

Siga estes passos no terminal da sua pasta do projeto para conectar ao seu repositório:

### 1. Iniciar o Repositório Local e Enviar para o GitHub
Abra o terminal na pasta do projeto e execute os comandos abaixo na ordem:

```bash
git init
git add .
git commit -m "🚀 Deploy inicial Leobet Pro"
git branch -M main
git remote add origin https://github.com/lrnegocio/Leobet-Pro.git
git push -u origin main
```
*Ao pedir o login, use seu e-mail do GitHub e no campo **Password**, cole o **Token** que você gerou.*

### 2. Deploy na Vercel
1. Vá para [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New" -> "Project"**.
3. Importe o repositório **Leobet-Pro**.
4. Em **Environment Variables**, adicione as chaves (se for usar Supabase no futuro):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**.

## 🛠️ Tecnologias
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Persistência**: LocalStorage (Modo de Alta Performance)

## 📡 Integrações
- **WhatsApp**: Envio de comprovantes automáticos com palpites detalhados e prêmios.
- **Impressão**: Formatação otimizada para impressoras térmicas Bluetooth 58mm.
- **PWA**: Instalável em Android e iOS.

---
© 2026 LEOBET PRO - Sistema Auditado 365 Dias.
