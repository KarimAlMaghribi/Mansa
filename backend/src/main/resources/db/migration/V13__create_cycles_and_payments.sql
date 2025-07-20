CREATE TABLE jamiah_cycles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    jamiah_id BIGINT NOT NULL,
    cycle_number INT NOT NULL,
    start_date DATE,
    completed BIT,
    CONSTRAINT fk_cycle_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah(id)
);

CREATE TABLE jamiah_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cycle_id BIGINT NOT NULL,
    user_profile_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    paid_at DATETIME,
    CONSTRAINT fk_payment_cycle FOREIGN KEY (cycle_id) REFERENCES jamiah_cycles(id),
    CONSTRAINT fk_payment_user FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id)
);

CREATE INDEX idx_cycle_jamiah ON jamiah_cycles(jamiah_id);
CREATE INDEX idx_payment_cycle ON jamiah_payments(cycle_id);
