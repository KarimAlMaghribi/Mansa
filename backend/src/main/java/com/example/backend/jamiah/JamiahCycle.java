package com.example.backend.jamiah;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "jamiah_cycles")
public class JamiahCycle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jamiah_id")
    private Jamiah jamiah;

    private Integer cycleNumber;
    private LocalDate startDate;
    private Boolean completed = false;

    /**
     * Order of members for the whole cycle (uids in payout order).
     * Generated once at the beginning of the cycle and copied to subsequent rounds.
     */
    @ElementCollection
    @CollectionTable(name = "jamiah_cycle_order", joinColumns = @JoinColumn(name = "cycle_id"))
    @Column(name = "member_uid")
    private List<String> memberOrder = new ArrayList<>();

    /** Current recipient for this round. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private com.example.backend.UserProfile recipient;

    /** Whether the current recipient confirmed receipt. */
    private Boolean recipientConfirmed = false;

    @OneToMany(mappedBy = "cycle")
    private Set<JamiahPayment> payments = new HashSet<>();
}
