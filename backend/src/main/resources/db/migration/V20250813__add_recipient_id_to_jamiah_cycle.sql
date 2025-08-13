ALTER TABLE jamiah_cycles
  ADD COLUMN recipient_id BIGINT NULL;

ALTER TABLE jamiah_cycles
  ADD CONSTRAINT fk_jc_recipient
  FOREIGN KEY (recipient_id) REFERENCES user_profiles(id);

CREATE INDEX idx_jc_recipient_id ON jamiah_cycle(recipient_id);
