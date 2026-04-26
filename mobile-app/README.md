# ACALMO - Aplicativo de Meditação VR

Aplicativo de meditação com gamificação e modo VR estereoscópico 360°.

## Tecnologias
- Expo SDK 52 + React Native + TypeScript
- Expo AV (áudio/vídeo), expo-sensors (motion tracking)
- expo-sqlite (armazenamento local offline)

## Estrutura Principal
- `app/vr-player.tsx` - Motor VR 360° estereoscópico
- `app/(tabs)/index.tsx` - Dashboard principal
- `app/progress.tsx` - Estatísticas e gráfico de humor
- `context/AudioContext.tsx` - Estado global de áudio
- `services/api.ts` - Integração com backend
- `services/db.ts` - Banco SQLite local

## Executando
```bash
npm install
npx expo start
```

## Gamificação
- Pontos (XP): 1 ponto por minuto de meditação
- Estrelas: Conquistadas em meditações únicas
- Bônus: 50 estrelas + 100 pontos no primeiro login
- Panorama Mental: Registro diário de humor

## Planos
- FREE: Meditações básicas com banners de upgrade
- PREMIUM: Acesso total + Modo VR Avançado

## Configuração
Variável de ambiente para API:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Consulte `constants/Config.ts` para URLs centralizadas.
