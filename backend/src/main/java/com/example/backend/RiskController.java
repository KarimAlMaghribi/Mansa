package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risks")
@CrossOrigin(origins = "*")
public class RiskController {

    private final RiskRepository riskRepository;
    private final PublisherRepository publisherRepository;

    public RiskController(RiskRepository riskRepository, PublisherRepository publisherRepository) {
        this.riskRepository = riskRepository;
        this.publisherRepository = publisherRepository;
    }

    @GetMapping
    public List<Risk> list() {
        return riskRepository.findAll();
    }

    @GetMapping("/{id}")
    public Risk get(@PathVariable Long id) {
        return riskRepository.findById(id).orElseThrow(() -> new RuntimeException("Risk not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Risk create(@RequestBody Risk risk) {
        if (risk.getPublisher() != null && risk.getPublisher().getId() == null) {
            Publisher saved = publisherRepository.save(risk.getPublisher());
            risk.setPublisher(saved);
        }
        return riskRepository.save(risk);
    }

    @PutMapping("/{id}")
    public Risk update(@PathVariable Long id, @RequestBody Risk risk) {
        Risk existing = riskRepository.findById(id).orElseThrow(() -> new RuntimeException("Risk not found"));
        existing.setName(risk.getName());
        existing.setDescription(risk.getDescription());
        existing.setValue(risk.getValue());
        existing.setDeclinationDate(risk.getDeclinationDate());
        existing.setStatus(risk.getStatus());
        existing.setRiskCategory(risk.getRiskCategory());
        existing.setRiskProbability(risk.getRiskProbability());
        return riskRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        riskRepository.deleteById(id);
    }
}
