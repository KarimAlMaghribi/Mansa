package com.example.backend.vote;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VoteService {
    private final VoteRepository repository;

    public VoteService(VoteRepository repository) {
        this.repository = repository;
    }

    public List<Vote> getVotes() {
        List<Vote> votes = repository.findAll();
        votes.forEach(this::checkExpiry);
        return votes;
    }

    public Vote createVote(String title, List<String> options) {
        Vote vote = new Vote();
        vote.setTitle(title);
        vote.setOptions(options);
        vote.setCreatedAt(LocalDateTime.now());
        vote.setExpiresAt(LocalDateTime.now().plusDays(5));
        return repository.save(vote);
    }

    public Vote castVote(Long id, String userId, String choice) {
        Vote vote = repository.findById(id).orElseThrow();
        checkExpiry(vote);
        if (Boolean.TRUE.equals(vote.getClosed())) {
            throw new IllegalStateException("Vote already closed");
        }
        vote.getBallots().put(userId, choice);
        return repository.save(vote);
    }

    private void checkExpiry(Vote vote) {
        if (Boolean.TRUE.equals(vote.getClosed())) return;
        if (vote.getExpiresAt() != null && LocalDateTime.now().isAfter(vote.getExpiresAt())) {
            boolean unanimous = !vote.getBallots().isEmpty() &&
                    vote.getBallots().values().stream().distinct().count() == 1;
            vote.setClosed(true);
            if (unanimous) {
                vote.setResult(vote.getBallots().values().stream().findFirst().orElse(null));
            } else {
                vote.setResult("REJECTED");
            }
            repository.save(vote);
        }
    }
}
