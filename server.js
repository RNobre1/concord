require('dotenv').config();
const WebSocket = require('ws');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Testa a conexão com o banco de dados
pool.connect()
    .then(() => console.log("Conectado ao banco de dados PostgreSQL"))
    .catch(err => {
        console.error("Erro ao conectar ao banco de dados:", err);
        process.exit(1);
    });

// Configuração do servidor WebSocket
const wss = new WebSocket.Server({ port: 8080 });
console.log("Servidor WebSocket rodando na porta 8080");

// Armazena conexões ativas dos usuários
const clients = {};

// Função para autenticar usuários com JWT
function authenticate(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// Evento ao conectar um cliente WebSocket
wss.on('connection', (ws) => {
    let userId;

    // Evento ao receber mensagens do cliente
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            // Registro de novo usuário
            if (data.type === 'register') {
                const { nome, email, password } = data;
                const passwordHash = await bcrypt.hash(password, 10);

                const query = `
                    INSERT INTO users (nome, email, password_hash)
                    VALUES ($1, $2, $3)
                        RETURNING userID
                `;
                const values = [nome, email, passwordHash];

                pool.query(query, values)
                    .then(result => {
                        ws.send(JSON.stringify({ type: 'register_success', userId: result.rows[0].userid }));
                    })
                    .catch(err => {
                        console.error(err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Erro ao registrar usuário.' }));
                    });
            }

            // Login do usuário
            else if (data.type === 'login') {
                const { email, password } = data;

                const query = `SELECT * FROM users WHERE email = $1`;
                pool.query(query, [email])
                    .then(async result => {
                        if (result.rows.length === 0 || !await bcrypt.compare(password, result.rows[0].password_hash)) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Credenciais inválidas.' }));
                            return;
                        }

                        userId = result.rows[0].userid;
                        const token = jwt.sign({ userId }, process.env.JWT_SECRET);

                        // Registra a sessão no banco de dados
                        const sessionQuery = `
                            INSERT INTO session (userid, token)
                            VALUES ($1, $2)
                                RETURNING sessionID
                        `;
                        pool.query(sessionQuery, [userId, token])
                            .then(() => {
                                clients[userId] = ws;
                                ws.send(JSON.stringify({ type: 'login_success', token }));
                            })
                            .catch(err => {
                                console.error("Erro ao registrar sessão:", err);
                                ws.send(JSON.stringify({ type: 'error', message: 'Erro ao registrar sessão.' }));
                            });
                    })
                    .catch(err => {
                        console.error(err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Erro no login.' }));
                    });
            }

            // Listar chats do usuário
            else if (data.type === 'list_chats') {
                const decoded = authenticate(data.token);
                if (!decoded) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Token inválido.' }));
                    return;
                }

                const query = `
                    SELECT c.chatid, c.nome, c.tipo_do_chat
                    FROM chat c
                    INNER JOIN chatusers cu ON c.chatid = cu.chatid
                    WHERE cu.userid = $1;
                `;
                pool.query(query, [decoded.userId])
                    .then(result => {
                        ws.send(JSON.stringify({ type: 'chat_list', chats: result.rows }));
                    })
                    .catch(err => {
                        console.error("Erro ao listar chats:", err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Erro ao listar chats.' }));
                    });
            }

            // Criar grupo/conversa
            else if (data.type === 'create_group') {
                const { token, groupName, participants } = data;
                const decoded = authenticate(token);

                if (!decoded) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Token inválido.' }));
                    return;
                }

                const creatorId = decoded.userId;

                // Cria um novo chat do tipo grupo
                const chatQuery = `
                    INSERT INTO chat (tipo_do_chat, nome)
                    VALUES ('grupo', $1)
                        RETURNING chatID
                `;
                pool.query(chatQuery, [groupName])
                    .then(chatResult => {
                        const chatId = chatResult.rows[0].chatid;

                        // Adiciona os participantes ao chat
                        const participantQueries = participants.map(participantId =>
                            pool.query(`INSERT INTO chatusers (chatid, userid) VALUES ($1, $2)`, [chatId, participantId])
                        );

                        participantQueries.push(
                            pool.query(`INSERT INTO chatusers (chatid, userid) VALUES ($1, $2)`, [chatId, creatorId])
                        );

                        Promise.all(participantQueries)
                            .then(() => {
                                ws.send(JSON.stringify({
                                    type: 'group_created',
                                    chatId,
                                    groupName,
                                    participants,
                                }));
                            })
                            .catch(err => {
                                console.error("Erro ao adicionar participantes:", err);
                                ws.send(JSON.stringify({ type: 'error', message: 'Erro ao criar grupo.' }));
                            });
                    })
                    .catch(err => {
                        console.error("Erro ao criar chat:", err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Erro ao criar grupo.' }));
                    });
            }

            // Enviar mensagem no chat atual
            else if (data.type === 'send_message') {
                const { token, chatId, content } = data;
                const decoded = authenticate(token);

                if (!decoded) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Token inválido.' }));
                    return;
                }

                const senderId = decoded.userId;

                // Armazena a mensagem no banco de dados
                const messageQuery = `
                    INSERT INTO message (chatid, senderid, content)
                    VALUES ($1, $2, $3)
                    RETURNING messageID
                `;
                pool.query(messageQuery, [chatId, senderId, content])
                    .then(() => {
                        // Recupera o histórico atualizado do chat e envia aos clientes conectados
                        const historyQuery = `
                            SELECT senderid, content, send_at
                            FROM message
                            WHERE chatid = $1
                            ORDER BY send_at ASC;
                        `;
                        pool.query(historyQuery, [chatId])
                            .then(historyResult => {
                                ws.send(JSON.stringify({
                                    type: 'chat_history',
                                    chatId,
                                    messages: historyResult.rows,
                                }));
                            })
                            .catch(err => console.error("Erro ao carregar histórico:", err));
                    })
                    .catch(err => console.error("Erro ao enviar mensagem:", err));
            }
        } catch (err) {
            console.error("Erro ao processar mensagem:", err);
        }
    });

    // Evento ao desconectar o cliente
    ws.on('close', () => {
        if (userId) delete clients[userId];
        console.log(`Usuário ${userId} desconectado.`);
    });
});
