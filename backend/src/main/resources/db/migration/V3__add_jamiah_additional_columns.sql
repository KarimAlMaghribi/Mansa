ALTER TABLE jamiah
    ADD COLUMN name VARCHAR(255) NOT NULL,
    ADD COLUMN monthly_contribution DECIMAL(19,2),
    ADD COLUMN is_public BIT;
