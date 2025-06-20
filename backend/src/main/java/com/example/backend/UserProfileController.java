package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/userProfiles")
@CrossOrigin(origins = "*")
public class UserProfileController {
    private final UserProfileRepository repository;

    public UserProfileController(UserProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<UserProfile> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public UserProfile get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/check")
    public boolean checkUsername(@RequestParam String username) {
        return !repository.existsByUsername(username);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfile create(@RequestBody UserProfile profile) {
        if (repository.existsByUsername(profile.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
        }
        return repository.save(profile);
    }

    @PutMapping("/{id}")
    public UserProfile update(@PathVariable Long id, @RequestBody UserProfile profile) {
        UserProfile existing = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getUsername().equals(profile.getUsername()) && repository.existsByUsername(profile.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
        }
        existing.setUsername(profile.getUsername());
        existing.setUid(profile.getUid());
        existing.setFirstName(profile.getFirstName());
        existing.setLastName(profile.getLastName());
        existing.setBirthDate(profile.getBirthDate());
        existing.setGender(profile.getGender());
        existing.setNationality(profile.getNationality());
        existing.setAddress(profile.getAddress());
        existing.setPhone(profile.getPhone());
        existing.setLanguage(profile.getLanguage());
        existing.setInterests(profile.getInterests());
        return repository.save(existing);
    }

    @PutMapping("/uid/{uid}")
    public UserProfile updateByUid(@PathVariable String uid, @RequestBody UserProfile profile) {
        UserProfile existing = repository.findByUid(uid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getUsername().equals(profile.getUsername()) && repository.existsByUsername(profile.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
        }
        existing.setUsername(profile.getUsername());
        existing.setUid(uid);
        existing.setFirstName(profile.getFirstName());
        existing.setLastName(profile.getLastName());
        existing.setBirthDate(profile.getBirthDate());
        existing.setGender(profile.getGender());
        existing.setNationality(profile.getNationality());
        existing.setAddress(profile.getAddress());
        existing.setPhone(profile.getPhone());
        existing.setLanguage(profile.getLanguage());
        existing.setInterests(profile.getInterests());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
