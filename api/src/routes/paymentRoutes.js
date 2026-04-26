const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment, PreApprovalPlan } = require('mercadopago');
const db = require('../database');

// Configuração do Mercado Pago (Token de Teste - Troque pelo seu em produção)
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-4198274395023812-042516-72834928347293847293847-123456789' 
});

// 1. Criar Preferência de Pagamento
router.post('/create-preference', async (req, res) => {
  const { userId, planId, planName, price } = req.body;

  try {
    // Modo Simulação para Testes se o token não for real
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('COLE_SEU_TOKEN')) {
      console.log(`[Pagamento] MODO SIMULAÇÃO ATIVO para usuário ${userId}`);
      return res.json({ 
        id: 'mock_pref_' + Date.now(), 
        init_point: 'https://www.mercadopago.com.br' // Abre o site do MP como simulação
      });
    }

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: `Plano Acalmo: ${planName}`,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL'
          }
        ],
        back_urls: {
          success: 'acalmo://payment-success',
          failure: 'acalmo://payment-failure',
          pending: 'acalmo://payment-pending'
        },
        auto_return: 'all', // Retorna automaticamente em todos os casos
        binary_mode: true, // Apenas Aprova ou Recusa (fluxo mais rápido)
        statement_descriptor: 'ACALMO MEDITACAO',
        external_reference: userId.toString(), 
        notification_url: 'https://seudominio.com/api/payments/webhook',
        payment_methods: {
          installments: 1, // Opcional: limita parcelas para simplificar
          excluded_payment_types: [
            { id: 'ticket' } // Exemplo: exclui boleto se quiser focar em Cartão/Pix mais rápido
          ]
        }
      }
    });

    // Registrar tentativa de transação no banco (Opcional, mas recomendado)
    console.log(`[Pagamento] Preferência criada para o usuário ${userId}: ${result.id}`);
    
    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('[Pagamento] Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

// 2. Criar Pagamento PIX (Checkout Transparente - Menor Fricção)
router.post('/create-pix-payment', async (req, res) => {
  const { userId, planId, price, email } = req.body;

  try {
    // Modo Simulação
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('COLE_SEU_TOKEN')) {
      return res.json({
        id: 'mock_pix_' + Date.now(),
        pix_code: '00020101021226870014BR.GOV.BCB.PIX01650000000000000000000000000000000000000000000000000000000000000000520400005303986540519.905802BR5916AcalmoMeditacao6009SAO PAULO62070503***6304E2D3',
        pix_qr_64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // Mock image
      });
    }

    const payment = new Payment(client);
    const body = {
      transaction_amount: Number(price),
      description: `Plano Acalmo: ${planId}`,
      payment_method_id: 'pix',
      payer: {
        email: email || 'usuario@acalmo.com',
        first_name: 'Usuario',
        last_name: 'Acalmo'
      },
      external_reference: userId.toString(),
      notification_url: 'https://seudominio.com/api/payments/webhook'
    };

    const result = await payment.create({ body });
    
    res.json({
      id: result.id,
      pix_code: result.point_of_interaction.transaction_data.qr_code,
      pix_qr_64: result.point_of_interaction.transaction_data.qr_code_base64
    });
  } catch (error) {
    console.error('[PIX] Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// 3. Criar Assinatura Recorrente (Cobrança Automática Mensal)
router.post('/create-subscription', async (req, res) => {
  const { userId, planId, planName, price, email } = req.body;
  console.log('>>> [Assinatura] Iniciando pedido para usuário:', userId, 'Plano:', planId);

  try {
    // Modo Simulação
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('COLE_SEU_TOKEN')) {
      console.log('>>> [Assinatura] MODO SIMULAÇÃO ATIVO');
      return res.json({
        id: 'mock_sub_' + Date.now(),
        init_point: 'https://www.mercadopago.com.br' // Simulação
      });
    }

    const plan = new PreApprovalPlan(client);
    
    const result = await plan.create({
      body: {
        reason: `Assinatura Acalmo: ${planName}`,
        auto_setup: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(price),
          currency_id: 'BRL'
        },
        back_url: 'acalmo://payment-success',
        status: 'active',
        external_reference: userId.toString(),
        payer_email: email || 'usuario@acalmo.com',
        card_token_id: '', // Deixe vazio para o checkout pro lidar
        auto_return: 'all'
      }
    });

    // O init_point levará o usuário para a tela onde ele autoriza a recorrência no cartão
    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('[Assinatura] Erro ao criar recorrência:', error);
    res.status(500).json({ error: 'Erro ao processar assinatura mensal' });
  }
});

// 4. Processar Pagamento Transparente (Cartão de Crédito direto no App)
router.post('/process-payment', async (req, res) => {
  const { userId, planId, price, token, email, installments, payment_method_id, issuer_id } = req.body;

  try {
    // Modo Simulação
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('COLE_SEU_TOKEN')) {
      console.log('>>> [Pagamento Transparente] MODO SIMULAÇÃO ATIVO');
      return res.json({
        status: 'approved',
        status_detail: 'accredited',
        id: 'mock_pay_' + Date.now()
      });
    }

    const payment = new Payment(client);
    const body = {
      transaction_amount: Number(price),
      description: `Assinatura Acalmo: ${planId}`,
      token: token,
      installments: Number(installments) || 1,
      payment_method_id: payment_method_id,
      issuer_id: issuer_id,
      payer: {
        email: email || 'usuario@acalmo.com'
      },
      external_reference: userId.toString(),
      notification_url: 'https://seudominio.com/api/payments/webhook'
    };

    const result = await payment.create({ body });
    
    // Se aprovado, já podemos atualizar o usuário aqui também (ou esperar o webhook)
    if (result.status === 'approved') {
       db.run('UPDATE users SET plan_id = ? WHERE id = ?', ['premium', userId]);
    }

    res.json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id
    });
  } catch (error) {
    console.error('[Transparente] Erro ao processar pagamento:', error);
    res.status(500).json({ error: 'Erro ao processar cartão' });
  }
});

// 2. Webhook para receber notificações do Mercado Pago
router.post('/webhook', async (req, res) => {
  const { action, data } = req.body;

  // O Mercado Pago envia várias notificações. Só nos interessa quando um pagamento é criado/atualizado.
  if (action === 'payment.created' || action === 'payment.updated' || req.query.type === 'payment') {
    const paymentId = data?.id || req.query['data.id'];
    
    try {
      // Aqui você buscaria os detalhes do pagamento no Mercado Pago usando o paymentId
      // Para este exemplo, vamos simular a aprovação e atualizar o usuário
      // No mundo real, você validaria se o status é 'approved'
      
      console.log(`[Webhook] Notificação de pagamento recebida: ${paymentId}`);
      
      // Simulação: Pegamos o userId da external_reference (você buscaria isso na API do MP)
      // db.run('UPDATE users SET plan_id = "premium" WHERE id = ?', [userId]);
      
      res.sendStatus(200);
    } catch (error) {
      console.error('[Webhook] Erro no processamento:', error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

module.exports = router;
