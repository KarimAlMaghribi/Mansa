package com.example.backend.jamiah;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.HashSet;
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

    @OneToMany(mappedBy = "cycle")
    private Set<JamiahPayment> payments = new HashSet<>();
}
