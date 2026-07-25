
'use server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-5125321872252102-123010-1e5de53b8331371d32f7aab5ea2a2bd0-38477053',
});

const payment = new Payment(client);

export async function createPixPayment(amount: number, user: { id: string, email: string, nome: string }) {
  try {
    const response = await payment.create({
      body: {
        transaction_amount: amount,
        description: `Depósito LEOBET PRO - ${user.nome}`,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          first_name: user.nome.split(' ')[0],
          last_name: user.nome.split(' ').slice(1).join(' ') || 'Cliente',
        },
        metadata: {
          user_id: user.id,
        },
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://' + process.env.VERCEL_URL}/api/webhooks/mercadopago`,
      },
    });

    return {
      id: response.id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      status: response.status,
    };
  } catch (error) {
    console.error('Erro ao criar pagamento MP:', error);
    throw new Error('Falha ao gerar o PIX. Tente novamente.');
  }
}
