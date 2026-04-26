# ACALMO - Projeto de Meditação e Realidade Virtual

## Visão Geral do Projeto

ACALMO é um aplicativo de meditação com gamificação e modo VR estereoscópico 360°, desenvolvido com Expo (React Native) para mobile e Node.js/Express para API.

## Estrutura do Projeto

```
acalmo-app/
├── api/                  # Backend Node.js + Express + SQLite
├── mobile-app/           # Frontend Expo (React Native)
└── README.md            # Documentação principal
```

---

## 1. Mobile App (mobile-app/)

### Tecnologias
- **Expo SDK 52**: Framework React Native
- **TypeScript**: Tipagem estática
- **Expo AV**: Reprodução de áudio/vídeo
- **Expo Sensors**: DeviceMotion para VR
- **SQLite (expo-sqlite)**: Armazenamento local offline

### Arquitectura VR
- **Visão Estereoscópica Side-by-Side**: Split screen para headsets VR
- **Motion Tracking**: Utiliza `expo-sensors` para rotação do dispositivo
- **Panning Animado**: Vídeo 360° em `Animated.View` com escala 0.7

### Arquivos Principais
- `app/vr-player.tsx`: Motor VR 360°
- `app/(tabs)/index.tsx`: Dashboard principal
- `app/progress.tsx`: Estatísticas e gráficos
- `services/api.ts`: Integração com backend
- `services/db.ts`: Banco SQLite local
- `context/AudioContext.tsx`: Estado global de áudio

### Gamificação
- **Pontos (XP)**: 1 ponto por minuto de meditação
- **Estrelas**: Conquistadas por meditações únicas
- **Bônus de Boas-vindas**: 50 estrelas + 100 pontos no primeiro login
- **Panorama Mental**: Registro diário de humor (Gráfico de Saúde Mental)

### Planos
- **FREE**: Meditações básicas, banners de upgrade
- **PREMIUM**: Acesso total, Modo VR Avançado

---

## 2. API (api/)

### Tecnologias
- **Node.js + Express**: Servidor web
- **SQLite3**: Banco de dados
- **JWT**: Autenticação
- **Multer**: Upload de arquivos (MP3/thumbnails)
- **Bcryptjs**: Hash de senhas
- **UUID**: Identificadores únicos

### Endpoints

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login (retorna JWT)

#### Músicas
- `GET /api/musics` - Listar músicas
- `POST /api/musics` - Upload música (multipart)
- `DELETE /api/musics/:uuid` - Remover música

#### other Routes
- `GET /api/plans` - Listar planos
- `GET /api/categories` - Listar categorias
- `GET /api/feelings` - Listar sentimentos
- `POST /api/stats` - Estatísticas do usuário

### Executando a API
```bash
cd api
npm run dev  # Porta 3000
```

---

## 3. Documentação de Agentes

### Agentes Disponíveis

| Agente | Descrição |
|--------|-----------|
| `explore` | Exploração de codebases, busca de arquivos e padrões |
| `general` | Tarefas multi-step e pesquisas complexas |

### Quando Usar

- **`explore`**: Para encontrar arquivos, buscar padrões de código, entender estrutura
- **`general`**: Para executar múltiplas tarefas autonomamente

---

## 4. Configuração

### Variáveis de Ambiente

**API (.env)**
```
JWT_SECRET=sua_chave_secreta
PORT=3000
```

**Mobile App (.env)**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Configuração Centralizada
- `constants/Config.ts`: URLs da API (Dev/Prod)

---

## 5. Executando o Projeto

### Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

### API
```bash
cd api
npm install
npm run dev
```

---

## 6. Design System

- **Cores**: Roxo Vibrante (`#820AD1`), Dark Mode profundo
- **Efeitos**: Glassmorphism com blur, gradientes lineares
- **Tipografia**: Pesos variados para hierarquia

---

## 7. Referências

- [Mobile App README](mobile-app/README.md)
- [API README](api/README.md)
- [Master Blueprint](mobile-app/agents-docs/MASTER_BLUEPRINT.md)
- [Arquitetura VR](mobile-app/agents-docs/architecture.md)