ALTER TABLE jamiah
    ADD COLUMN max_members INT;

CREATE TABLE jamiah_members (
    jamiah_id BIGINT NOT NULL,
    user_profile_id BIGINT NOT NULL,
    PRIMARY KEY (jamiah_id, user_profile_id),
    CONSTRAINT fk_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah(id),
    CONSTRAINT fk_user_profile FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id)
);
