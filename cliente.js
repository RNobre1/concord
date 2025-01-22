// Conexão com o servidor WebSocket
const ws = new WebSocket("ws://localhost:8080");

// Variáveis globais
let token = null; // Armazena o token JWT após login
let userId = null; // Armazena o ID do usuário logado
let currentChatId = null; // ID do chat atualmente aberto

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
        token = data.token; // Salva o token JWT
        alert("Login realizado com sucesso!");
        document.getElementById("auth").style.display = "none";
        document.getElementById("chat-list").style.display = "block";
        userId = jwtDecode(token).userId; // Decodifica o token para obter o userId
        document.getElementById("user-info").innerText = `Seu ID de usuário: ${userId}`;
        listChats(); // Carrega a lista de chats do usuário
    } else if (data.type === "chat_list") {
        loadChatList(data.chats); // Exibe a lista de chats
    } else if (data.type === "chat_history") {
        loadChatHistory(data.messages); // Carrega o histórico de mensagens do chat atual
    } else if (data.type === "group_created") {
        alert(`Grupo "${data.groupName}" criado com sucesso!`);
        openChat(data.chatId); // Abre o chat automaticamente após a criação
    } else if (data.type === "error") {
        alert(`Erro: ${data.message}`);
    }
};

// Evento ao ocorrer um erro na conexão WebSocket
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

// Função para carregar a lista de chats na interface
function loadChatList(chats) {
    const chatList = document.getElementById("chat-list-items");
    chatList.innerHTML = ""; // Limpa a lista anterior

    chats.forEach((chat) => {
        const li = document.createElement("li");
        li.textContent = `${chat.nome} (${chat.tipodochat})`;
        li.onclick = () => openChat(chat.chatid);
        chatList.appendChild(li);
    });
}

// Função para abrir um chat específico
function openChat(chatId) {
    currentChatId = chatId;

    // Solicita o histórico de mensagens do servidor
    ws.send(JSON.stringify({
        type: "load_chat",
        token,
        chatId,
    }));

    document.getElementById("chat-list").style.display = "none";
    document.getElementById("chat").style.display = "block";
}

// Função para carregar o histórico de mensagens no chat atual
function loadChatHistory(messages) {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = ""; // Limpa mensagens anteriores

    messages.forEach((msg) => {
        addMessage(msg.senderid === userId ? "right" : "left", msg.content);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rola para a última mensagem
}

// Função para adicionar uma mensagem ao chat
function addMessage(side, content) {
    const messagesDiv = document.getElementById("messages");
    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message", side);
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rola para a última mensagem
}

// Enviar mensagem no chat atual
document.getElementById("send-message").onclick = () => {
    const content = document.getElementById("message-input").value;

    if (!currentChatId || !content.trim()) return;

    ws.send(JSON.stringify({
        type: "send_message",
        token,
        chatId: currentChatId,
        content,
    }));

    addMessage("right", content); // Exibe a mensagem enviada localmente
    document.getElementById("message-input").value = ""; // Limpa o campo de texto
};

// Criar um novo grupo/conversa pelo popup
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

// Voltar para a listagem de chats
document.getElementById("back-to-list").onclick = () => {
    currentChatId = null;

    document.getElementById("chat").style.display = "none";
    document.getElementById("chat-list").style.display = "block";
};

// Função para decodificar o token JWT e obter informações do usuário logado
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
