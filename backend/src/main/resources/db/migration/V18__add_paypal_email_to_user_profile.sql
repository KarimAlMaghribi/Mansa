ALTER TABLE user_profiles ADD COLUMN paypal_email VARCHAR(255);
CREATE UNIQUE INDEX idx_user_profiles_paypal_email ON user_profiles (paypal_email);
