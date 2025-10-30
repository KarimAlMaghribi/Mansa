ALTER TABLE jamiah ADD COLUMN name VARCHAR(255);
ALTER TABLE jamiah ADD COLUMN monthly_contribution DECIMAL(19,2);
ALTER TABLE jamiah ADD COLUMN is_public BIT;

UPDATE jamiah SET name = CONCAT('Jamiah ', id) WHERE name IS NULL;

ALTER TABLE jamiah
    MODIFY COLUMN name VARCHAR(255) NOT NULL;
