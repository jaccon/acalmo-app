const db = require('./database');
const fs = require('fs');
const path = require('path');

const musicFiles = [
  { file: '01.mp3', title: 'Ondas do Amanhecer', desc: 'Sinta a energia do oceano ao despertar.', category_id: 'relax', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { file: '02.mp3', title: 'Sussurro da Floresta', desc: 'Conecte-se com a natureza profunda.', category_id: 'foco', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' },
  { file: '03.mp3', title: 'Paz na Montanha', desc: 'Encontre o silêncio nas alturas.', category_id: 'relax', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800' },
  { file: '04.mp3', title: 'Chuva Relaxante', desc: 'O som perfeito para uma noite de sono.', category_id: 'sono', img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800' },
  { file: '06.mp3', title: 'Lago de Cristal', desc: 'Meditação profunda para clareza mental.', category_id: 'foco', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800' },
  { file: '07.mp3', title: 'Vento Suave', desc: 'Deixe as preocupações serem levadas.', category_id: 'relax', img: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800' },
  { file: '08.mp3', title: 'Céu Estrelado', desc: 'Uma viagem astral antes de dormir.', category_id: 'sono', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800' },
];

async function seed() {
  console.log('--- Iniciando Importação de Músicas ---');
  const BASE_URL = 'http://172.16.0.105:8712/uploads/music/';

  // Garantir categorias existem
  const cats = [
    { uuid: 'relax', name: 'Relaxamento' },
    { uuid: 'sono', name: 'Sono' },
    { uuid: 'foco', name: 'Foco' }
  ];

  for (const c of cats) {
    db.run('INSERT OR IGNORE INTO categories (uuid, name) VALUES (?, ?)', [c.uuid, c.name]);
  }

  for (const m of musicFiles) {
    const contentUrl = `${BASE_URL}${m.file}`;
    const uuid = 'mus_' + m.file.replace('.mp3', '');
    
    db.run(
      `INSERT OR REPLACE INTO musics (uuid, title, description, content, thumbnail, category_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid, m.title, m.desc, contentUrl, m.img, m.category_id, 'active'],
      function(err) {
        if (err) {
          console.error(`Erro ao inserir ${m.title}:`, err.message);
        } else {
          console.log(`✓ Adicionado: ${m.title}`);
        }
      }
    );
  }
}

seed();
