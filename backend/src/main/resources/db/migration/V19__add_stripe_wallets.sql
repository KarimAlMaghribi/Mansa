ALTER TABLE jamiah_payments
    ADD COLUMN stripe_payment_intent_id VARCHAR(255);

CREATE TABLE wallets (
    member_id BIGINT NOT NULL PRIMARY KEY,
    balance DECIMAL(19,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_member FOREIGN KEY (member_id) REFERENCES user_profiles (id)
);

CREATE INDEX idx_wallets_updated_at ON wallets (updated_at);
