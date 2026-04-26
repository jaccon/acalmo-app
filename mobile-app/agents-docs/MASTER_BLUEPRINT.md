# ACALMO - Master Blueprint

Este documento é a "fonte da verdade" sobre as regras de negócio, lógica de funcionamento e estrutura do ecossistema ACALMO (Mobile + API).

## 1. Regras de Negócio & Gamificação
O aplicativo utiliza um sistema de retenção baseado em gamificação:
- **Pontos (XP)**: Ganhos por tempo de meditação. Cada minuto meditado = X pontos.
- **Estrelas**: Ganhos por completar meditações únicas.
- **Bônus de Boas-vindas**: O usuário ganha 50 estrelas e 100 pontos no primeiro login (controlado pela flag `reward_claimed` no banco local).
- **Panorama Mental**: Sistema de registro de humor diário (Triste a Muito Feliz) para gerar o gráfico de "Saúde Mental" na tela de progresso.

## 2. Sistema de Planos (Assinaturas)
- **FREE**: Acesso a meditações básicas. Exibe banners de upgrade.
- **PREMIUM**: Acesso total, incluindo Modo VR Avançado e conteúdos exclusivos. 
- **Verificação**: O app consulta `user.plan_id` via API e ajusta a UI dinamicamente.

## 3. Fluxo de Dados e Persistência
- **Local (SQLite)**: Armazena progresso offline, histórico de humor e configurações de gamificação (`mobile-app/services/db.ts`).
- **Remoto (API)**: Armazena credenciais (JWT), catálogo de músicas, vídeos VR e metadados globais.
- **Sincronia**: O app prioriza a UI local para velocidade e sincroniza com a API em segundo plano.

## 4. Estrutura de Arquivos Críticos (Mobile)
- `/app/(tabs)/index.tsx`: Dashboard principal com Panorama Mental e Lista de Meditações.
- `/app/vr-player.tsx`: Motor imersivo 360° estereoscópico.
- `/app/progress.tsx`: Tela de analytics e estatísticas do usuário.
- `/context/AudioContext.tsx`: Gerenciador global de estado (Usuário, Pontos, Áudio).
- `/constants/Config.ts`: Centralizador de URLs (Dev/Prd).

## 5. Design System
- **Cores**: Roxo Vibrante (`#820AD1`), Dark Mode profundo.
- **Efeitos**: Glassmorphism (blur em overlays), Gradientes lineares.
- **Tipografia**: Uso de pesos variados para hierarquia de informações.
