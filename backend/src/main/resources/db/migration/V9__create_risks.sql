CREATE TABLE risks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(2048),
    value DECIMAL(19,2),
    publisher_id BIGINT,
    declination_date DATE,
    created_at DATETIME,
    updated_at DATETIME,
    published_at DATETIME,
    withdrawn_at DATETIME,
    status VARCHAR(20),
    risk_category VARCHAR(255),
    risk_probability DOUBLE,
    CONSTRAINT fk_risk_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id)
);

CREATE INDEX idx_risk_publisher ON risks(publisher_id);
