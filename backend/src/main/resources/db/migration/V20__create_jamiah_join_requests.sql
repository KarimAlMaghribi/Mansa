CREATE TABLE jamiah_join_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    jamiah_id BIGINT NOT NULL,
    user_profile_id BIGINT NOT NULL,
    motivation VARCHAR(2048),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_jamiah_join_requests_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah (id),
    CONSTRAINT fk_jamiah_join_requests_user FOREIGN KEY (user_profile_id) REFERENCES user_profiles (id),
    CONSTRAINT uk_jamiah_join_requests UNIQUE (jamiah_id, user_profile_id)
);

CREATE INDEX idx_jamiah_join_requests_jamiah_id ON jamiah_join_requests (jamiah_id);
CREATE INDEX idx_jamiah_join_requests_user_profile_id ON jamiah_join_requests (user_profile_id);

