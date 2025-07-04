CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255),
    username VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    birth_date VARCHAR(255),
    gender VARCHAR(255),
    nationality VARCHAR(255),
    address VARCHAR(255),
    phone VARCHAR(255),
    language VARCHAR(255),
    interests VARCHAR(2048),
    CONSTRAINT uk_user_profiles_username UNIQUE (username)
);
