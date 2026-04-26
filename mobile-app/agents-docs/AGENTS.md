# Documentação de Agentes - Mobile App

## Visão Geral
Este documento detalha a estrutura, padrões e artefatos relevantes para agentes de IA trabalhando no código mobile do ACALMO.

## Estrutura de Diretórios
```
mobile-app/
├── app/                    # Arquivos de rota (Expo Router)
│   ├── (tabs)/            # Navegação por abas
│   │   ├── index.tsx      # Dashboard principal
│   │   └── progress.tsx   # Estatísticas do usuário
│   ├── vr-player.tsx      # Motor VR 360°
│   └── _layout.tsx        # Layout root
├── components/            # Componentes React reutilizáveis
├── constants/             # Configurações centralizadas
│   └── Config.ts          # URLs da API (Dev/Prod)
├── context/               # React Context
│   └── AudioContext.tsx   # Estado global de áudio
├── hooks/                 # Custom hooks
├── services/              # Serviços externos
│   ├── api.ts             # Integração REST API
│   ├── db.ts              # Banco SQLite local
│   ├── rewardService.ts   # Sistema de recompensas
│   └── statsService.ts    # Estatísticas
├── agents-docs/           # Documentação para agentes
│   ├── MASTER_BLUEPRINT.md
│   └── architecture.md
└── package.json
```

## Arquitetura VR
- **Localização**: `app/vr-player.tsx`
- **Tecnologia**: Split screen side-by-side + expo-sensors (DeviceMotion)
- **Motion Tracking**: Rotação do dispositivo控制panning animado do vídeo 360°
- **Sync Áudio**: Vídeo oculto 0x0 reproduz áudio para evitar bloqueios de autoplay

## Gamificação
- Pontos (XP): 1 ponto/minuto de meditação
- Estrelas: Conquistadas em meditações únicas
- Bônus de Boas-vindas: 50 estrelas + 100 pontos (flag `reward_claimed`)
- Panorama Mental: Registro diário de humor

## Planos
- **FREE**: Meditações básicas, banners de upgrade
- **PREMIUM**: Acesso total + Modo VR Avançado

## Design System
- Cor primária: Roxo Vibrante `#820AD1`
- Dark Mode profundo
- Glassmorphism com blur
- Gradientes lineares

## Configuração
- Variáveis: `.env` com `EXPO_PUBLIC_API_URL`
- Nunca usar IPs hardcoded - sempre usar `Config.API_URL`

## Referências
- `agents-docs/MASTER_BLUEPRINT.md` - Regras de negócio
- `agents-docs/architecture.md` - Detalhes técnicos VR