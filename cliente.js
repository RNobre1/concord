// Conexão com o servidor WebSocket
const ws = new WebSocket("ws://localhost:8080");

// Variáveis globais
let token = null;
let userId = null;
let currentChatId = null;

// Evento ao abrir a conexão WebSocket
ws.onopen = () => {
    console.log("Conectado ao servidor WebSocket.");
};

// Evento ao receber mensagens do servidor WebSocket
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "register_success") {
        alert(`Registro bem-sucedido! Seu ID: ${data.userId}`);
    } else if (data.type === "login_success") {
        token = data.token;
        userId = jwtDecode(token).userId;
        // Tenta obter o nome via token ou pelo campo de registro; se indisponível, usa um valor padrão
        const nome = jwtDecode(token).nome || "Usuário";
        alert("Login realizado com sucesso!");
        document.getElementById("auth").style.display = "none";
        document.getElementById("app").style.display = "flex";
        // Atualiza a informação do perfil com a imagem, nome e ID
        document.getElementById("profile-info").innerText = `${nome} (${userId})`;
        listChats();
    } else if (data.type === "chat_list") {
        loadChatList(data.chats);
    } else if (data.type === "chat_history") {
        loadChatHistory(data.messages);
    } else if (data.type === "group_created") {
        alert(`Grupo "${data.groupName}" criado com sucesso!`);
        openChat(data.chatId);
    } else if (data.type === "error") {
        alert(`Erro: ${data.message}`);
    }
};

// Evento de erro na conexão WebSocket
ws.onerror = (error) => {
    console.error("Erro no WebSocket:", error);
};

// Registro de novo usuário
document.getElementById("register").onclick = () => {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    ws.send(JSON.stringify({
        type: "register",
        nome,
        email,
        password,
    }));
};

// Login do usuário
document.getElementById("login").onclick = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    ws.send(JSON.stringify({
        type: "login",
        email,
        password,
    }));
};

// Função para listar os chats do usuário
function listChats() {
    ws.send(JSON.stringify({
        type: "list_chats",
        token,
    }));
}

// Função para carregar a lista de chats na sidebar
function loadChatList(chats) {
    const chatList = document.getElementById("chat-list-items");
    chatList.innerHTML = "";

    chats.forEach((chat) => {
        const li = document.createElement("li");
        li.textContent = `${chat.nome}`;
        li.onclick = () => openChat(chat.chatid);
        chatList.appendChild(li);
    });
}

// Função para abrir um chat específico
function openChat(chatId) {
    currentChatId = chatId;
    ws.send(JSON.stringify({
        type: "load_chat",
        token,
        chatId,
    }));
}

// cliente.js - Função addMessage modificada
function addMessage(side, content, senderId, timestamp) {
    const messagesDiv = document.getElementById('messages');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', side);

    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="sender-info">${senderId}</span>
            <div class="message-text">${content}</div>
            <span class="message-time">${time}</span>
        </div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Atualização no carregamento do histórico
function loadChatHistory(messages) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
        const side = msg.senderid === userId ? 'right' : 'left';
        addMessage(side, msg.content, msg.senderid, msg.timestamp);
    });
}

// Modificação no envio de mensagens
document.getElementById('send-message').onclick = () => {
    const content = document.getElementById('message-input').value;
    if (!currentChatId || !content.trim()) return;

    const timestamp = new Date().toISOString();

    ws.send(JSON.stringify({
        type: 'sendmessage',
        token: token,
        chatId: currentChatId,
        content: content,
        timestamp: timestamp
    }));

    addMessage('right', content, userId, timestamp);
    document.getElementById('message-input').value = '';
};


// Popup para criação de grupo
document.getElementById("create-chat").onclick = () => {
    document.getElementById("popup-create-group").style.display = "block";
};

document.getElementById("popup-cancel").onclick = () => {
    document.getElementById("popup-create-group").style.display = "none";
};

document.getElementById("popup-create-group-btn").onclick = () => {
    const groupName = document.getElementById("popup-group-name").value;
    const participants = document.getElementById("popup-group-participants")
        .value.split(",")
        .map(id => parseInt(id.trim()));

    ws.send(JSON.stringify({
        type: "create_group",
        token,
        groupName,
        participants,
    }));
    document.getElementById("popup-create-group").style.display = "none";
};

// Botão para voltar à lista (útil em dispositivos móveis)
document.getElementById("back-to-list").onclick = () => {
    currentChatId = null;
    document.getElementById("messages").innerHTML = "";
};

// Função para decodificar o token JWT
function jwtDecode(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(
        atob(base64)
            .split("")
            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    ));
}
