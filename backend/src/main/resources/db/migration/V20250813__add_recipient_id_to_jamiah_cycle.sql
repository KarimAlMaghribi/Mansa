ALTER TABLE jamiah_cycle
  ADD COLUMN recipient_id BIGINT NULL;

ALTER TABLE jamiah_cycle
  ADD CONSTRAINT fk_jc_recipient
  FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);

CREATE INDEX idx_jc_recipient_id ON jamiah_cycle(recipient_id);
