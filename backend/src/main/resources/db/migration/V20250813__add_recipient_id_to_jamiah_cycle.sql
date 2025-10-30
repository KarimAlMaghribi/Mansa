-- Ensure jamiah_cycles has the recipient foreign key and supporting index.
-- The plain statements below cover databases without MySQL-specific features (e.g. H2 for tests).
ALTER TABLE jamiah_cycles ADD CONSTRAINT fk_jc_recipient FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);
CREATE INDEX idx_jc_recipient_id ON jamiah_cycles(recipient_id);

-- MySQL compatibility block keeps the migration idempotent on environments where the constraint/index may already exist.
/*! DROP PROCEDURE IF EXISTS add_recipient_fk_and_index */;
/*! DELIMITER $$ */
/*! CREATE PROCEDURE add_recipient_fk_and_index()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'jamiah_cycles'
          AND CONSTRAINT_NAME = 'fk_jc_recipient'
    ) THEN
        ALTER TABLE jamiah_cycles
            ADD CONSTRAINT fk_jc_recipient FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'jamiah_cycles'
          AND INDEX_NAME = 'idx_jc_recipient_id'
    ) THEN
        CREATE INDEX idx_jc_recipient_id ON jamiah_cycles(recipient_id);
    END IF;
END$$ */
/*! DELIMITER ; */
/*! CALL add_recipient_fk_and_index */;
/*! DROP PROCEDURE add_recipient_fk_and_index */;
