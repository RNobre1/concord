const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Para gerar IDs únicos para os usuários

// Cria o servidor WebSocket na porta 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor WebSocket rodando na porta 8080');

// Objeto para armazenar conexões ativas (usuários conectados)
const clients = {};

// Evento de nova conexão
wss.on('connection', (ws) => {
    // Gera um ID único para cada cliente conectado
    const userId = uuidv4();
    clients[userId] = ws;

    console.log(`Novo cliente conectado: ${userId}`);

    // Envia o ID do usuário ao cliente
    ws.send(JSON.stringify({ type: 'welcome', userId }));

    // Escuta mensagens enviadas pelo cliente
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Verifica o tipo de mensagem e processa
            if (data.type === 'private_message') {
                const { recipientId, content } = data;

                // Verifica se o destinatário está conectado
                if (clients[recipientId]) {
                    clients[recipientId].send(
                        JSON.stringify({
                            type: 'private_message',
                            senderId: userId,
                            content,
                        })
                    );
                } else {
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            message: 'Usuário destinatário não está conectado.',
                        })
                    );
                }
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    });

    // Evento de desconexão do cliente
    ws.on('close', () => {
        console.log(`Cliente desconectado: ${userId}`);
        delete clients[userId]; // Remove o cliente da lista de conexões ativas
    });
});
