package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "jamiah_payments")
public class JamiahPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private JamiahCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id")
    private UserProfile user;

    private BigDecimal amount;
    private LocalDateTime paidAt;

    /** Whether the payer confirmed the payment. */
    private Boolean confirmed = false;

    /** Whether the current recipient confirmed receiving this payment. */
    private Boolean recipientConfirmed = false;
}
