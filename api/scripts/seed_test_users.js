const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function createUsers() {
  const users = [
    { username: 'premium', password: 'premium123', name: 'Usuário Premium', plan_id: 'PREMIUM', email: 'premium@acalmo.com' },
    { username: 'free', password: 'free123', name: 'Usuário Free', plan_id: 'FREE', email: 'free@acalmo.com' }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    db.run(
      `INSERT OR REPLACE INTO users (username, password, name, plan_id, email) VALUES (?, ?, ?, ?, ?)`,
      [user.username, hashedPassword, user.name, user.plan_id, user.email],
      (err) => {
        if (err) {
          console.error(`Erro ao criar usuário ${user.username}:`, err.message);
        } else {
          console.log(`Usuário ${user.username} criado/atualizado com sucesso!`);
        }
      }
    );
  }
}

createUsers();
