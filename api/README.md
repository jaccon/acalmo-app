# API de Gerenciamento de Músicas - Meditation App

Esta API foi construída com Node.js, Express e SQLite para gerenciar músicas MP3 e thumbnails, com segurança JWT.

## Tecnologias Utilizadas
- **Node.js & Express**: Framework web.
- **SQLite3**: Banco de dados relacional leve.
- **JWT (JSON Web Token)**: Autenticação segura.
- **Multer**: Middleware para upload de arquivos (MP3 e Imagens).
- **Bcryptjs**: Hash de senhas.
- **UUID**: Identificadores únicos para as músicas.

## Estrutura de Arquivos
- `src/index.js`: Ponto de entrada da aplicação.
- `src/database.js`: Configuração e inicialização do banco SQLite.
- `src/middleware/auth.js`: Middleware de proteção de rotas.
- `src/controllers/`: Lógica de autenticação e gerenciamento de músicas.
- `src/routes/`: Definição dos endpoints.
- `uploads/`: Pastas para armazenamento físico dos arquivos.

## Endpoints

### Autenticação
- `POST /api/auth/register`: Registrar um novo usuário (`username`, `password`).
- `POST /api/auth/login`: Fazer login e receber o token JWT (`username`, `password`).

### Músicas (Requer Header: `Authorization: Bearer <TOKEN>`)
- `GET /api/musics`: Lista todas as músicas cadastradas.
- `POST /api/musics`: Adiciona uma nova música (Multipart/form-data).
  - Campos: `title`, `description`, `status`, `category`, `application`.
  - Arquivos: `music` (MP3), `thumbnail` (Imagem).
- `DELETE /api/musics/:uuid`: Remove uma música e seus arquivos físicos.

## Como Executar
1. Entre na pasta `api`: `cd api`
2. Inicie o servidor: `npm run dev` (requer `nodemon`) ou `npm start`
3. O servidor rodará em `http://localhost:3000`

## Exemplo de Armazenamento
Os dados das músicas contêm:
- `uuid`: Identificador único.
- `title`: Título da música.
- `description`: Descrição.
- `thumbnail`: Caminho da imagem de capa.
- `content`: Caminho do arquivo MP3.
- `status`: Status da música (ex: 'active').
- `category`: Categoria (ex: 'zen').
- `application`: ID da aplicação vinculada.
