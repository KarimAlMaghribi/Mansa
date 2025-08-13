-- Safely ensure jamiah_cycles has the recipient foreign key and index
-- without failing when they already exist

DROP PROCEDURE IF EXISTS add_recipient_fk_and_index;
DELIMITER $$
CREATE PROCEDURE add_recipient_fk_and_index()
BEGIN
    -- Add the foreign key only if it is missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'jamiah_cycles'
          AND CONSTRAINT_NAME = 'fk_jc_recipient'
    ) THEN
        ALTER TABLE jamiah_cycles
            ADD CONSTRAINT fk_jc_recipient FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);
    END IF;

    -- Create the index on recipient_id if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'jamiah_cycles'
          AND INDEX_NAME = 'idx_jc_recipient_id'
    ) THEN
        CREATE INDEX idx_jc_recipient_id ON jamiah_cycles(recipient_id);
    END IF;
END$$
DELIMITER ;

CALL add_recipient_fk_and_index();
DROP PROCEDURE add_recipient_fk_and_index;
