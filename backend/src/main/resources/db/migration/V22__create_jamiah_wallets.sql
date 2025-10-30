CREATE TABLE jamiah_wallets (
    jamiah_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    balance DECIMAL(19,2) NOT NULL DEFAULT 0,
    stripe_account_id VARCHAR(255),
    kyc_status VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (jamiah_id, member_id),
    CONSTRAINT fk_jamiah_wallets_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah (id) ON DELETE CASCADE,
    CONSTRAINT fk_jamiah_wallets_member FOREIGN KEY (member_id) REFERENCES user_profiles (id) ON DELETE CASCADE
);

CREATE INDEX idx_jamiah_wallets_member ON jamiah_wallets (member_id);
CREATE INDEX idx_jamiah_wallets_updated_at ON jamiah_wallets (updated_at);

INSERT INTO jamiah_wallets (jamiah_id, member_id, balance, created_at, updated_at)
SELECT jm.jamiah_id,
       w.member_id,
       w.balance,
       COALESCE(w.updated_at, CURRENT_TIMESTAMP),
       COALESCE(w.updated_at, CURRENT_TIMESTAMP)
FROM wallets w
JOIN jamiah_members jm ON jm.user_profile_id = w.member_id
UNION
SELECT j.id,
       w.member_id,
       w.balance,
       COALESCE(w.updated_at, CURRENT_TIMESTAMP),
       COALESCE(w.updated_at, CURRENT_TIMESTAMP)
FROM wallets w
JOIN user_profiles up ON up.id = w.member_id
JOIN jamiah j ON j.owner_id = up.uid
WHERE NOT EXISTS (
    SELECT 1
    FROM jamiah_members jm
    WHERE jm.jamiah_id = j.id
      AND jm.user_profile_id = w.member_id
);

DROP TABLE wallets;
