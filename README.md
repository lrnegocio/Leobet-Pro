
# LEOBET PRO - Plataforma de Apostas Profissional

Plataforma completa para gestão de Bingos e Bolões de Futebol, com auditoria em tempo real, integração com Supabase Cloud e deploy automático via Vercel.

## 🚀 Como subir atualizações para o GitHub

Toda vez que você quiser enviar as novas funções do terminal para o seu site, execute estes 3 comandos:

```bash
# 1. Adicionar as novas alterações
git add .

# 2. Criar um registro do que mudou
git commit -m "🚀 Atualização de performance e filtros"

# 3. Enviar para a nuvem (Use seu Token do GitHub como senha)
git push
```

A **Vercel** detectará o envio e atualizará seu link automaticamente em 2 minutos.

## 📡 Configurações do Banco de Dados (Supabase)

### Limpeza de Espaço (Mantenha o sistema rápido)
O Supabase gratuito tem 500MB. Para garantir que ele nunca lote, você pode rodar este comando no **SQL Editor** a cada 3 meses:

```sql
-- Apaga registros com mais de 90 dias
DELETE FROM tickets WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM transactions WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🛠️ Tecnologias
- **Frontend**: Next.js 15 (App Router)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Hospedagem**: Vercel
- **Estilização**: Tailwind CSS + ShadCN UI

---
© 2026 LEOBET PRO - Sistema Auditado 365 Dias.
