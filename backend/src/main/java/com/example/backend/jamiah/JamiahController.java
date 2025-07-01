package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jamiahs")
@Validated
@CrossOrigin(origins = "*")
public class JamiahController {
    private final JamiahService service;

    public JamiahController(JamiahService service) {
        this.service = service;
    }

    @GetMapping
    public List<JamiahDto> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JamiahDto create(@Valid @RequestBody JamiahDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public JamiahDto update(@PathVariable Long id, @Valid @RequestBody JamiahDto dto) {
        return service.update(id, dto);
    }

    @PostMapping("/{id}/invite")
    public JamiahDto invite(@PathVariable Long id) {
        return service.createOrRefreshInvitation(id);
    }

    @PostMapping("/join")
    public JamiahDto join(@RequestParam String code) {
        return service.joinByInvitation(code);
    }
}
