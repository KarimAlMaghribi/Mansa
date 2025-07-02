package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.example.backend.jamiah.JamiahMapper;
import java.util.stream.Collectors;

import java.util.List;

@RestController
@RequestMapping("/api/userProfiles")
@CrossOrigin(origins = "*")
public class UserProfileController {
    private final UserProfileRepository repository;
    private final JamiahMapper jamiahMapper;

    public UserProfileController(UserProfileRepository repository, JamiahMapper jamiahMapper) {
        this.repository = repository;
        this.jamiahMapper = jamiahMapper;
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
        UserProfile entity = repository.findByUid(uid).orElse(null);

        // create new profile if none exists for the uid
        if (entity == null) {
            if (repository.existsByUsername(profile.getUsername())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
            }
            entity = new UserProfile();
        } else if (!entity.getUsername().equals(profile.getUsername()) && repository.existsByUsername(profile.getUsername())) {
            // update path but new username already taken
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already taken");
        }

        entity.setUsername(profile.getUsername());
        entity.setUid(uid);
        entity.setFirstName(profile.getFirstName());
        entity.setLastName(profile.getLastName());
        entity.setBirthDate(profile.getBirthDate());
        entity.setGender(profile.getGender());
        entity.setNationality(profile.getNationality());
        entity.setAddress(profile.getAddress());
        entity.setPhone(profile.getPhone());
        entity.setLanguage(profile.getLanguage());
        entity.setInterests(profile.getInterests());
        return repository.save(entity);
    }

    @GetMapping("/uid/{uid}/jamiahs")
    public List<com.example.backend.jamiah.dto.JamiahDto> getJamiahs(@PathVariable String uid) {
        return repository.findWithJamiahsByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND))
                .getJamiahs().stream()
                .map(jamiahMapper::toDto)
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
