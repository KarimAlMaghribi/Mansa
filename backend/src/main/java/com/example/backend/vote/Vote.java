package com.example.backend.vote;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Entity
@Table(name = "votes")
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ElementCollection
    @CollectionTable(name = "vote_options", joinColumns = @JoinColumn(name = "vote_id"))
    @Column(name = "option_value")
    private List<String> options = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "vote_ballots", joinColumns = @JoinColumn(name = "vote_id"))
    @MapKeyColumn(name = "user_id")
    @Column(name = "choice")
    private Map<String, String> ballots = new HashMap<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;

    private Boolean closed = false;
    private String result;
}
