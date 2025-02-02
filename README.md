# Web Chat

Uma aplicação de chat em tempo real desenvolvida com WebSocket que permite comunicação entre múltiplos usuários através de chats privados e em grupo.

## ✨ Funcionalidades
- Registro e autenticação de usuários
- Chat privado entre dois usuários
- Chat em grupo com múltiplos participantes
- Comunicação em tempo real via WebSocket
- Histórico persistente de mensagens
- Interface web responsiva

## 🛠 Tecnologias
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js
- **Banco de Dados**: PostgreSQL
- **Comunicação**: WebSocket
- **Autenticação**: JWT (JSON Web Tokens)

## 📋 Requisitos Funcionais

### Registro e Autenticação
- Criação de conta com nome, email e senha
- Login com validação de credenciais
- Gerenciamento de sessões ativas

### Mensagens
- Envio e recebimento em tempo real
- Suporte a chats privados e em grupo
- Histórico de conversas persistente
- Notificações de novas mensagens

### Gerenciamento de Chats
- Criação de chats privados
- Criação de grupos
- Adição/remoção de participantes em grupos


## ⚙️ Instalação

1. Clone o repositório:
```
git clone https://github.com/RNobre1/web_chat.git
cd web_chat
```



3. Instale as dependências:
```
npm install
```


4. Configure o banco de dados:
- Instale PostgreSQL
- Execute o script `criacao-banco.sql`

4. Inicie o servidor:
```
node server.js
```

5. Acesse a aplicação em `http://localhost:3000`
