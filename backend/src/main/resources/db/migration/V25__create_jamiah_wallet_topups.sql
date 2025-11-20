CREATE TABLE jamiah_wallet_topups (
    id BIGINT NOT NULL AUTO_INCREMENT,
    jamiah_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    payment_intent_status VARCHAR(255),
    applied BOOLEAN NOT NULL DEFAULT FALSE,
    rolled_back BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_jamiah_wallet_topups_stripe_intent UNIQUE (stripe_payment_intent_id),
    CONSTRAINT fk_jamiah_wallet_topups_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah (id) ON DELETE CASCADE,
    CONSTRAINT fk_jamiah_wallet_topups_member FOREIGN KEY (member_id) REFERENCES user_profiles (id) ON DELETE CASCADE
);

CREATE INDEX idx_jamiah_wallet_topups_jamiah ON jamiah_wallet_topups (jamiah_id);
CREATE INDEX idx_jamiah_wallet_topups_member ON jamiah_wallet_topups (member_id);
