'use server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

// Credenciais oficiais fornecidas pelo usuário
const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-5125321872252102-123010-1e5de53b8331371d32f7aab5ea2a2bd0-38477053',
});

const payment = new Payment(client);

export async function createPixPayment(amount: number, user: { id: string, email: string, nome: string }) {
  try {
    // Garantir que o valor seja no mínimo 1.00 para evitar erros em alguns ambientes
    const transactionAmount = Math.max(amount, 1);
    
    // Tratamento de nome para evitar erro de falta de sobrenome na API do MP
    const nameParts = user.nome.trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Leobet';

    // Garantir e-mail válido (caso o usuário use apenas login)
    const payerEmail = user.email.includes('@') ? user.email : `${user.id.toLowerCase()}@leotv.fun`;

    const response = await payment.create({
      body: {
        transaction_amount: transactionAmount,
        description: `Recarga LEOBET PRO - ${user.nome.substring(0, 20)}`,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        metadata: {
          user_id: user.id,
        },
        // Removemos a notification_url se for IP fixo sem SSL para evitar bloqueio da API em testes
        notification_url: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago` 
          : undefined,
      },
    });

    return {
      id: response.id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Erro detalhado MP:', error?.message || error);
    throw new Error('Falha ao gerar o PIX. Verifique se o valor é válido e tente novamente.');
  }
}
