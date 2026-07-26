'use server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-5125321872252102-123010-1e5de53b8331371d32f7aab5ea2a2bd0-38477053',
});

const payment = new Payment(client);

export async function createPixPayment(amount: number, user: { id: string, email: string, nome: string }, ticketId?: string) {
  try {
    // Mercado Pago exige no mínimo 0.01, removemos o arredondamento para 1.00
    const transactionAmount = Number(amount.toFixed(2));
    
    const nameParts = (user.nome || 'Cliente Leobet').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Pro';

    const payerEmail = (user.email && user.email.includes('@')) ? user.email : `${user.id.toLowerCase()}@leobet.pro`;

    const response = await payment.create({
      body: {
        transaction_amount: transactionAmount,
        description: ticketId ? `Pagamento Bilhete ${ticketId}` : `Recarga LEOBET PRO - ${user.nome?.substring(0, 15)}`,
        payment_method_id: 'pix',
        notification_url: 'https://leotv.fun/api/webhooks/mercadopago',
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        metadata: {
          user_id: user.id,
          ticket_id: ticketId || null,
          type: ticketId ? 'ticket_payment' : 'deposit'
        },
      },
    });

    return {
      id: response.id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Erro MP:', error?.message || error);
    throw new Error('Falha ao gerar PIX. O valor mínimo é R$ 0.01.');
  }
}
