package com.example.backend.jamiah;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.example.backend.UserProfile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "jamiah_cycle")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JamiahCycle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jamiah_id", nullable = false)
    @JsonIdentityReference(alwaysAsId = true)
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
    @OrderColumn(name = "order_index")
    private List<String> memberOrder = new ArrayList<>();

    /** Current recipient for this round. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    @JsonIdentityReference(alwaysAsId = true)
    private UserProfile recipient;

    /** Whether the current recipient confirmed receipt. */
    private Boolean recipientConfirmed = false;

    @OneToMany
    @JoinColumn(name = "cycle_id", referencedColumnName = "id")
    private Set<JamiahPayment> payments = new HashSet<>();
}
