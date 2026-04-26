const db = require('./database');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const DEFAULT_CATEGORY_UUID = 'cat-0000-0000-0000-default';

async function seed() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  db.serialize(() => {
    // 1. Insert Categories
    const categories = [
      [DEFAULT_CATEGORY_UUID, 'Geral', 'Categoria padrão para meditações']
    ];

    const catSql = 'INSERT OR REPLACE INTO categories (uuid, name, description) VALUES (?, ?, ?)';
    categories.forEach(cat => {
      db.run(catSql, cat);
    });

    // 2. Insert Plans
    const plans = [
      ['free', 'Plano Gratuito', 0.0, '/limitado', 0, JSON.stringify(['Acesso limitado', '5 meditações grátis']), 0, null, 'Acesso às 5 primeiras meditações'],
      ['monthly', 'Plano Mensal', 19.90, '/mês', 30, JSON.stringify(['Acesso a todas as meditações', 'Downloads offline', 'Qualidade de áudio HD', 'Sem anúncios']), 0, null, 'Assinatura mensal recorrente'],
      ['annual', 'Plano Anual', 149.90, '/ano', 365, JSON.stringify(['Tudo do plano mensal', '2 meses grátis', 'Suporte prioritário', 'Conteúdo exclusivo']), 1, 'MELHOR VALOR', 'Economize com o plano anual']
    ];

    const planSql = 'INSERT OR REPLACE INTO plans (id, name, price, period, duration_days, features, highlight, badge, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    plans.forEach(plan => {
      db.run(planSql, plan);
    });

    // 3. Insert Test Users
    const users = [
      ['admin', adminPassword, 'admin@teste.com', 'admin'],
      ['user_teste', userPassword, 'user@teste.com', 'customer']
    ];

    const userSql = 'INSERT OR REPLACE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)';
    users.forEach(user => {
      db.run(userSql, user);
    });

    // 3. Insert Initial Configurations
    const configs = [
      ['feature_gamification', 'true', 1, 'Ativa sistema de pontos e horas'],
      ['feature_social_login', 'true', 1, 'Ativa login com Google'],
      ['app_maintenance_mode', 'false', 0, 'Bloqueia o app para manutenção']
    ];

    const configSql = 'INSERT OR REPLACE INTO configurations (key, value, is_enabled, description) VALUES (?, ?, ?, ?)';
    configs.forEach(config => {
      db.run(configSql, config);
    });

    // 4. Insert Default Application
    const apps = [
      ['meditation_mobile_app', 'super_secret_client_key_2026', 'Meditation Mobile App']
    ];

    const appSql = 'INSERT OR REPLACE INTO applications (client_id, client_secret, name) VALUES (?, ?, ?)';
    apps.forEach(app => {
      db.run(appSql, app);
    });

    console.log('Seed completed successfully!');
    console.log('Admin: admin / admin123');
    console.log('User: user_teste / user123');
    console.log('Client App Credentials:');
    console.log('  x-client-id: meditation_mobile_app');
    console.log('  x-client-secret: super_secret_client_key_2026');
    db.close();
  });
}

seed().catch(err => {
  console.error('Error during seed:', err);
  db.close();
});
