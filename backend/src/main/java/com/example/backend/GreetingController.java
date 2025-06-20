package com.example.backend;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/greetings")
@CrossOrigin(origins = "*")
public class GreetingController {
    private final GreetingRepository repository;

    public GreetingController(GreetingRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Greeting> list() {
        return repository.findAll();
    }

    @PostMapping
    public Greeting create(@RequestBody Greeting greeting) {
        return repository.save(greeting);
    }
}
