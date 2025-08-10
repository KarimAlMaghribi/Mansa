CREATE TABLE votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    created_at DATETIME,
    expires_at DATETIME,
    closed BOOLEAN,
    result VARCHAR(255)
);

CREATE TABLE vote_options (
    vote_id BIGINT NOT NULL,
    option_value VARCHAR(255),
    CONSTRAINT fk_vote_options_vote FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
);

CREATE TABLE vote_ballots (
    vote_id BIGINT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    choice VARCHAR(255),
    PRIMARY KEY (vote_id, user_id),
    CONSTRAINT fk_vote_ballots_vote FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
);
