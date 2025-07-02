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

    @GetMapping("/{id}")
    public JamiahDto get(@PathVariable String id) {
        return service.findByPublicId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JamiahDto create(@Valid @RequestBody JamiahDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public JamiahDto update(@PathVariable String id, @Valid @RequestBody JamiahDto dto) {
        return service.update(id, dto);
    }

    @PostMapping("/{id}/invite")
    public JamiahDto invite(@PathVariable String id) {
        return service.createOrRefreshInvitation(id);
    }

    @PostMapping("/join")
    public JamiahDto join(@RequestParam String code, @RequestParam String uid) {
        return service.joinByInvitation(code, uid);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
