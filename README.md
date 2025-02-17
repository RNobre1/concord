# Web Chat

O Web Chat é uma aplicação web de bate-papo em tempo real feita para facilitar a comunicação entre usuários através de uma interface simples e objetiva. Esta aplicação conecta clientes e servidor utilizando tecnologias modernas de desenvolvimento web, permitindo troca de mensagens instantânea e eficiente.

## Sumário
- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação e Execução](#instalação-e-execução)

## Descrição

O Web Chat foi desenvolvido para oferecer uma experiência de comunicação em tempo real por meio da web. A aplicação permite que vários usuários se conectem simultaneamente e troquem mensagens sem a necessidade de recarregar a página. Seu principal propósito é demonstrar o uso prático de sockets e a integração de tecnologia de back-end com front-end em projetos web. Confira a documentação na pasta docs.

## Funcionalidades

- **Chat em Tempo Real:** Envio e recebimento instantâneo de mensagens.
- **Interface Intuitiva:** Design simples e responsivo para facilitar a comunicação.
- **Gerenciamento de Usuários:** Identificação dos participantes no chat.
- **Histórico de Mensagens:** Armazenamento temporário (ou persistente, conforme a implementação) do fluxo de mensagens.

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript voltado para aplicações de alta performance.
- **Express.js:** Framework web para Node.js que simplifica a criação de servidores.
- **Socket.IO:** Biblioteca para comunicação em tempo real entre cliente e servidor.
- **HTML/CSS/JavaScript:** Tecnologias básicas para criação da interface e interatividade do usuário.

## Instalação e Execução

### Pré-requisitos

- Node.js (versão 12 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Passos para instalação

1. Clone o repositório:
```
git clone https://github.com/RNobre1/web_chat.git
cd web_chat
```

2. Instale as dependências:
```
npm install
```

3. Configure o banco de dados:
- Instale PostgreSQL
- Execute o script `criacao-banco.sql` na pasta docs
- Crie um arquivo .env na raiz do sistema com essa estrutura:
```
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
DB_HOST=hostmane_do_banco
DB_PORT=porta_do_banco
DB_NAME=nome_do_banco_de_dados
JWT_SECRET=sua_senha_para_o_token
```

4. Inicie o servidor:
```
node server.js
```

5. Acesse a aplicação em `http://localhost:3000`
