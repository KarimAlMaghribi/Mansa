package com.example.backend.vote;

import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/votes")
@CrossOrigin(origins = "*")
public class VoteController {
    private final VoteService service;

    public VoteController(VoteService service) {
        this.service = service;
    }

    @GetMapping
    public List<Vote> listVotes() {
        return service.getVotes();
    }

    @PostMapping
    public Vote create(@RequestBody CreateVoteRequest request) {
        return service.createVote(request.getTitle(), request.getOptions());
    }

    @PostMapping("/{id}/vote")
    public Vote vote(@PathVariable Long id, @RequestBody CastVoteRequest request) {
        return service.castVote(id, request.getUserId(), request.getChoice());
    }

    @Data
    static class CreateVoteRequest {
        private String title;
        private List<String> options;
    }

    @Data
    static class CastVoteRequest {
        private String userId;
        private String choice;
    }
}
