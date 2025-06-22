package com.example.backend.jamiah;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/jamiahs")
@CrossOrigin(origins = "*")
public class JamiahController {
    private final JamiahRepository repository;

    public JamiahController(JamiahRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Jamiah> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Jamiah get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Jamiah create(@RequestBody Jamiah jamiah) {
        return repository.save(jamiah);
    }

    @PutMapping("/{id}")
    public Jamiah update(@PathVariable Long id, @RequestBody Jamiah jamiah) {
        Jamiah existing = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setName(jamiah.getName());
        existing.setMonthlyContribution(jamiah.getMonthlyContribution());
        existing.setIsPublic(jamiah.getIsPublic());
        existing.setMaxGroupSize(jamiah.getMaxGroupSize());
        existing.setCycles(jamiah.getCycles());
        existing.setRate(jamiah.getRate());
        existing.setRateInterval(jamiah.getRateInterval());
        existing.setPlannedStartDate(jamiah.getPlannedStartDate());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
