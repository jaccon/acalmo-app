import * as SQLite from 'expo-sqlite';
import Config from '../constants/Config';


let db: SQLite.SQLiteDatabase | null = null;

export const initDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('meditation.db');
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY NOT NULL,
      points INTEGER DEFAULT 0,
      stars INTEGER DEFAULT 0,
      reward_claimed INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meditation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meditation_id TEXT,
      title TEXT,
      date TEXT,
      completed INTEGER DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      title TEXT,
      url TEXT,
      image TEXT,
      duration TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS feeling_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feeling TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seeding quotes if empty
  const quoteCheck: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM quotes');
  if (quoteCheck.count === 0) {
    console.log('[DB] Seeding 500 quotes...');
    const baseQuotes = [
      "Respire fundo e deixe o mundo lá fora.",
      "Você é mais forte do que imagina.",
      "Cada momento é um novo começo.",
      "A paz começa com um sorriso interno.",
      "Sinta a gratidão em cada batida do coração.",
      "O agora é o único momento que temos.",
      "Seja a calma no meio da tempestade.",
      "Sua mente é seu jardim, cultive pensamentos bons.",
      "A jornada de mil milhas começa com um passo.",
      "Confie no processo da vida.",
      "O silêncio é a voz da alma.",
      "Permita-se apenas ser, sem julgamentos.",
      "Tudo o que você precisa já está dentro de você.",
      "A clareza mental traz liberdade.",
      "Seja gentil consigo mesmo hoje.",
      "Desconecte para se reconectar.",
      "A vida é um fluxo constante de energia.",
      "O equilíbrio é a chave para a felicidade.",
      "Ouça o que o seu corpo está dizendo.",
      "Transforme seus desafios em degraus.",
      "A felicidade não é um destino, é o caminho.",
      "Ame a pessoa que você está se tornando.",
      "Sua luz interna brilha mais forte no silêncio.",
      "Liberte o que não te serve mais.",
      "Aceite o presente como ele é.",
      "A compaixão cura o coração.",
      "Mantenha o foco no que realmente importa.",
      "Sinta a terra sob seus pés e o céu acima.",
      "Você merece paz e tranquilidade.",
      "Deixe a ansiedade ir com a expiração.",
      "Inspire coragem, expire medo.",
      "Sua presença é o seu maior presente.",
      "Cultive a paciência como uma virtude.",
      "A beleza está nos detalhes da vida.",
      "Crie um espaço sagrado dentro de si.",
      "O amor é a força mais poderosa do universo.",
      "Mude seus pensamentos e mudará seu mundo.",
      "Seja a mudança que você deseja ver.",
      "A gratidão transforma o que temos em suficiente.",
      "Sua intuição é seu guia mais confiável.",
      "Abra-se para as infinitas possibilidades.",
      "O repouso é tão importante quanto o agir.",
      "Celebre suas pequenas vitórias.",
      "A harmonia interior reflete no exterior.",
      "Descubra a força que existe na sua vulnerabilidade.",
      "A sabedoria vem da observação silenciosa.",
      "Nutra sua alma com momentos de paz.",
      "O perdão liberta o coração para amar.",
      "Acredite na magia dos novos começos.",
      "Você é o arquiteto da sua própria paz."
    ];

    // Gerando variações para chegar a 500 frases
    const prefixes = ["Lembre-se:", "Sinta isso:", "Acredite:", "Hoje:", "No silêncio:", "Respire:", "Com calma:", "Neste momento:"];
    const suffixes = ["Siga em frente.", "Você consegue.", "Sinta a paz.", "Confie.", "Paz.", "Luz.", "Foco.", "Equilíbrio."];
    
    let allQuotes = [...baseQuotes];
    while (allQuotes.length < 500) {
      const base = baseQuotes[Math.floor(Math.random() * baseQuotes.length)];
      const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
      const newQuote = `${pref} ${base.charAt(0).toLowerCase() + base.slice(1)} ${suff}`;
      if (!allQuotes.includes(newQuote)) {
        allQuotes.push(newQuote);
      }
    }

    for (const text of allQuotes) {
      await db.runAsync('INSERT INTO quotes (text) VALUES (?)', [text]);
    }
    console.log('[DB] Seeding completo.');
  }
  
  return db;
};

export const getRandomQuote = async () => {
  const database = await initDb();
  const quote: any = await database.getFirstAsync('SELECT text FROM quotes ORDER BY RANDOM() LIMIT 1');
  return quote?.text || "Respire fundo e aproveite o momento.";
};

export const saveHistory = async (meditationId: string, title: string, completed: boolean) => {
  const database = await initDb();
  const date = new Date().toLocaleString('pt-BR');
  await database.runAsync(
    'INSERT INTO meditation_history (meditation_id, title, date, completed) VALUES (?, ?, ?, ?)',
    [meditationId, title, date, completed ? 1 : 0]
  );
};

export const getHistory = async () => {
  const database = await initDb();
  return await database.getAllAsync('SELECT * FROM meditation_history ORDER BY id DESC');
};

export const getRanking = async () => {
  const database = await initDb();
  return await database.getAllAsync(`
    SELECT title, COUNT(*) as count 
    FROM meditation_history 
    GROUP BY title 
    ORDER BY count DESC 
    LIMIT 5
  `);
};

export const isMeditationCompleted = async (meditationId: string) => {
  const database = await initDb();
  const result: any = await database.getFirstAsync(
    'SELECT id FROM meditation_history WHERE meditation_id = ? AND completed = 1',
    [meditationId]
  );
  return !!result;
};

export const getUniqueCompletionsCount = async () => {
  const database = await initDb();
  const result: any = await database.getFirstAsync(
    'SELECT COUNT(DISTINCT meditation_id) as count FROM meditation_history WHERE completed = 1'
  );
  return result?.count || 0;
};

export const getProgress = async () => {
  const database = await initDb();
  const result: any = await database.getFirstAsync('SELECT points, stars, reward_claimed, total_minutes FROM user_progress WHERE id = 1');
  return result || { points: 0, stars: 0, reward_claimed: 0, total_minutes: 0 };
};

export const claimReward = async () => {
  const database = await initDb();
  await database.runAsync('UPDATE user_progress SET reward_claimed = 1 WHERE id = 1');
};

export const addPoints = async (amount: number) => {
  const database = await initDb();
  const current: any = await getProgress();
  let newPoints = current.points + amount;
  let newStars = current.stars + Math.floor(newPoints / 100);
  newPoints = newPoints % 100;

  await database.runAsync(
    'UPDATE user_progress SET points = ?, stars = ? WHERE id = 1',
    [newPoints, newStars]
  );
  
  return { points: newPoints, stars: newStars };
};

export const addMinutes = async (amount: number) => {
  const database = await initDb();
  await database.runAsync('UPDATE user_progress SET total_minutes = total_minutes + ? WHERE id = 1', [amount]);
};

export const toggleFavorite = async (item: any) => {
  const database = await initDb();
  const exists: any = await database.getFirstAsync('SELECT id FROM favorites WHERE id = ?', [item.id]);
  
  if (exists) {
    await database.runAsync('DELETE FROM favorites WHERE id = ?', [item.id]);
    return false;
  } else {
    await database.runAsync(
      'INSERT INTO favorites (id, title, url, image, duration) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.title, item.url, item.image, item.duration || '']
    );
    return true;
  }
};

export const isFavorite = async (id: string) => {
  const database = await initDb();
  const result: any = await database.getFirstAsync('SELECT id FROM favorites WHERE id = ?', [id]);
  return !!result;
};

export const getFavorites = async () => {
  const database = await initDb();
  const rows = await database.getAllAsync('SELECT * FROM favorites');
  // Sanitiza URLs para evitar IPs locais antigos
  return rows.map((item: any) => ({
    ...item,
    url: item.url?.replace('http://172.16.0.105:8712', Config.API_URL),
    image: item.image?.replace('http://172.16.0.105:8712', Config.API_URL)
  }));
};

export const logFeelingClick = async (feeling: string) => {
  const database = await initDb();
  await database.runAsync('INSERT INTO feeling_clicks (feeling) VALUES (?)', [feeling]);
};

export const getFeelingStats = async () => {
  const database = await initDb();
  return await database.getAllAsync(`
    SELECT feeling, COUNT(*) as count 
    FROM feeling_clicks 
    GROUP BY feeling 
    ORDER BY count DESC
  `);
};
