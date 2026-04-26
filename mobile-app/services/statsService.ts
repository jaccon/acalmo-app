import { getProgress } from './db';
import Config from '../constants/Config';


const SYNC_INTERVAL_MINUTES = 3; // Envia a cada 3 minutos acumulados
let pendingMinutes = 0;

export const trackMinutes = async (userId: number, minutes: number) => {
  pendingMinutes += minutes;

  console.log(`[Stats] Minutos pendentes para sincronização: ${pendingMinutes}`);

  if (pendingMinutes >= SYNC_INTERVAL_MINUTES) {
    await syncWithServer(userId);
  }
};

export const syncWithServer = async (userId: number) => {
  if (pendingMinutes <= 0 || !userId) return;

  try {
    console.log(`[Stats] Sincronizando ${pendingMinutes} minutos com o servidor...`);
    
    const response = await fetch(`${Config.API_URL}/api/user/sync-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        minutes: pendingMinutes,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[Stats] Sincronização concluída com sucesso.');
      pendingMinutes = 0; // Limpa o contador local de pendências
    }
  } catch (error) {
    console.warn('[Stats] Falha ao sincronizar com o servidor. Tentará novamente no próximo lote.', error);
  }
};
