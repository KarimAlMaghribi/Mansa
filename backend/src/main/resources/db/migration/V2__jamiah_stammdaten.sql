ALTER TABLE jamiah ADD COLUMN max_group_size INT;
ALTER TABLE jamiah ADD COLUMN cycle_count INT;
ALTER TABLE jamiah ADD COLUMN rate_amount DECIMAL(10,2);
ALTER TABLE jamiah ADD COLUMN rate_interval VARCHAR(255);
ALTER TABLE jamiah ADD COLUMN start_date DATE;
ALTER TABLE jamiah ADD COLUMN is_public BIT;

ALTER TABLE jamiah ADD CONSTRAINT ck_max_group_size CHECK (max_group_size > 1);
ALTER TABLE jamiah ADD CONSTRAINT ck_rate_amount CHECK (rate_amount > 0);
