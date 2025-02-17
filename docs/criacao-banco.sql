CREATE TYPE tipo AS ENUM ('privado', 'grupo');

-- Criação da tabela User
CREATE TABLE Users (
    userID SERIAL PRIMARY KEY,
    nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) UNIQUE NOT NULL,
    password_hash VARCHAR(265) NOT NULL
);

-- Criação da tabela Chat
CREATE TABLE Chat (
    chatID SERIAL PRIMARY KEY,
    tipo_do_chat tipo NOT NULL,
    nome VARCHAR(45)
);

-- Criação da tabela ChatUsers (tabela associativa entre Chat e User)
CREATE TABLE ChatUsers (
    participanteID SERIAL PRIMARY KEY,
    chatID INT NOT NULL,
    userID INT NOT NULL,
    FOREIGN KEY (chatID) REFERENCES Chat(chatID) ON DELETE CASCADE,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

-- Criação da tabela Message
CREATE TABLE Message (
    messageID SERIAL PRIMARY KEY,
    chatID INT NOT NULL,
    senderID INT NOT NULL,
    content TEXT NOT NULL,
    send_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatID) REFERENCES Chat(chatID) ON DELETE CASCADE,
    FOREIGN KEY (senderID) REFERENCES Users(userID) ON DELETE CASCADE
);

-- Criação da tabela Session
CREATE TABLE Session (
    sessionID SERIAL PRIMARY KEY,
    userID INT NOT NULL,
    token VARCHAR(265) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);
