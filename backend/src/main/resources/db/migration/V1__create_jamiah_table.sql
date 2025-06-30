CREATE TABLE jamiah (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        cycle_count INT NOT NULL,
                        rate_amount DECIMAL(19,2) NOT NULL,
                        rate_interval VARCHAR(50) NOT NULL,
                        start_date DATE
);