package com.example.backend.jamiah;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "jamiah_payments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"jamiah_id", "cycle_id", "payer_uid"}))
public class JamiahPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jamiah_id", nullable = false)
    private Long jamiahId;

    @Column(name = "cycle_id", nullable = false)
    private Long cycleId;

    @Column(name = "payer_uid", nullable = false)
    private String payerUid;

    private BigDecimal amount;

    /** Whether the payer confirmed the payment. */
    private Boolean confirmed = false;

    private Instant paidAt;

    /** Whether the current recipient confirmed receiving this payment. */
    private Boolean recipientConfirmed = false;

    private Instant recipientConfirmedAt;
}
