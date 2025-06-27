-- Collaborative Draw Chat Database Schema

-- Users table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    gender ENUM('M', 'F') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_gender (gender)
);

-- Sessions table
CREATE TABLE Sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creatorId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_creator (creatorId)
);

-- Session participants
CREATE TABLE SessionParticipants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sessionId INT NOT NULL,
    userId INT NOT NULL,
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES Sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_user (sessionId, userId),
    INDEX idx_session (sessionId),
    INDEX idx_user (userId)
);

-- Chat messages
CREATE TABLE Messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sessionId INT NOT NULL,
    senderId INT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES Sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_session_time (sessionId, timestamp),
    INDEX idx_sender (senderId)
);

-- Friend requests
CREATE TABLE FriendRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fromUserId INT NOT NULL,
    toUserId INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fromUserId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (toUserId) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (fromUserId, toUserId),
    INDEX idx_from_user (fromUserId),
    INDEX idx_to_user (toUserId),
    INDEX idx_status (status)
);

-- Friendships
CREATE TABLE Friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1Id INT NOT NULL,
    user2Id INT NOT NULL,
    since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1Id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2Id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user1Id, user2Id),
    INDEX idx_user1 (user1Id),
    INDEX idx_user2 (user2Id)
);

-- Posts (artwork)
CREATE TABLE Posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    imageUrl TEXT NOT NULL,
    caption TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_time (userId, createdAt),
    INDEX idx_created (createdAt)
);

-- Sample data for testing
INSERT INTO Users (username, email, passwordHash, gender) VALUES
('alice', 'alice@example.com', '$2a$10$dummyhash', 'F'),
('bob', 'bob@example.com', '$2a$10$dummyhash', 'M'),
('charlie', 'charlie@example.com', '$2a$10$dummyhash', 'M'),
('diana', 'diana@example.com', '$2a$10$dummyhash', 'F'); 