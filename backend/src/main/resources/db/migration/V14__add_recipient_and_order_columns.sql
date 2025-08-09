ALTER TABLE jamiah_cycles
    ADD COLUMN recipient_id BIGINT,
    ADD COLUMN recipient_confirmed BIT;

ALTER TABLE jamiah_cycles
    ADD CONSTRAINT fk_cycle_recipient FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);

CREATE TABLE jamiah_cycle_order (
    cycle_id BIGINT NOT NULL,
    order_index INT NOT NULL,
    member_uid VARCHAR(255),
    CONSTRAINT fk_cycle_order_cycle FOREIGN KEY (cycle_id) REFERENCES jamiah_cycles(id)
);

ALTER TABLE jamiah_payments
    ADD COLUMN confirmed BIT;
