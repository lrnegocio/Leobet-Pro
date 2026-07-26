import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-5125321872252102-123010-1e5de53b8331371d32f7aab5ea2a2bd0-38477053',
});

const payment = new Payment(client);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('data.id') || searchParams.get('id');
    const type = searchParams.get('type');

    if (type === 'payment' && id) {
      const paymentData = await payment.get({ id });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata.user_id;
        const ticketId = paymentData.metadata.ticket_id;
        const amount = paymentData.transaction_amount;

        // 1. Se for um pagamento de bilhete direto
        if (ticketId) {
          const { data: ticket } = await supabaseAdmin.from('tickets').select('status, tickets_data').eq('id', ticketId).single();
          if (ticket) {
             const updatedData = ticket.tickets_data?.map((t: any) => ({ ...t, status: 'pago' }));
             await supabaseAdmin.from('tickets').update({ status: 'pago', tickets_data: updatedData }).eq('id', ticketId);
          }
        } else {
          // 2. Se for um depósito de saldo
          const { data: userProfile } = await supabaseAdmin.from('users').select('balance').eq('id', userId).single();
          if (userProfile) {
            const newBalance = (Number(userProfile.balance) || 0) + (Number(amount) || 0);
            await supabaseAdmin.from('users').update({ balance: newBalance }).eq('id', userId);
          }
        }

        // 3. Registra transação
        await supabaseAdmin.from('transactions').insert([{
          user_id: userId,
          amount: amount,
          type: ticketId ? 'venda' : 'deposito',
          status: 'aprovado',
          metadata: { mp_id: id, ticket_id: ticketId }
        }]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
