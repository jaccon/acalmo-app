# Arquitetura Mobile - ACALMO VR

Este documento descreve as principais implementações técnicas do aplicativo mobile, com foco no motor de Realidade Virtual e integração de áudio.

## 1. Motor VR Estereoscópico (Side-by-Side)
Localização: `app/vr-player.tsx`

O modo VR utiliza uma técnica de **Visão Binocular** para headsets (estilo Google Cardboard):
- **Split Screen**: A tela é dividida em dois componentes `VREye` idênticos.
- **Motion Tracking**: Utiliza `expo-sensors` (DeviceMotion) para capturar a rotação do dispositivo (Gamma e Beta).
- **Panning**: O vídeo é renderizado em um `Animated.View` com escala aumentada (`scale: 0.7`) que se desloca conforme a inclinação do celular, simulando uma janela 360°.

## 2. Sincronia de Áudio "Nuclear"
Para evitar bloqueios de autoplay dos sistemas operacionais (iOS/Android):
- O áudio da meditação é reproduzido através de um componente **`Video` oculto** (`0x0`).
- O som só é disparado quando o vídeo do cenário VR completa o carregamento (`onLoad`).
- **Fallback**: Se o áudio local (HTTP) falhar, o sistema busca automaticamente um backup em servidor externo (HTTPS).

## 3. Sistema de Configuração (Dev vs Prd)
O app utiliza um sistema centralizado de URLs:
- **Configuração**: `constants/Config.ts`
- **Variáveis**: `.env` (`EXPO_PUBLIC_API_URL`)
- **Regra**: Nunca use IPs hardcoded. Sempre utilize `${Config.API_URL}`.

## 4. Integração com Gamificação
- O progresso do usuário é atualizado no Modo VR através da função `addMinutes(1)` disparada por um `setInterval` a cada 60 segundos, garantindo que o tempo de imersão conte pontos para o perfil.
