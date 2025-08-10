package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.JamiahCycle;
import com.example.backend.jamiah.JamiahPayment;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

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

    @GetMapping("/public")
    public List<JamiahDto> listPublic() {
        return service.findAllPublic();
    }

    @GetMapping("/{id}")
    public JamiahDto get(@PathVariable String id) {
        return service.findByPublicId(id);
    }

    @GetMapping("/{id}/members")
    public java.util.List<com.example.backend.UserProfile> members(@PathVariable String id) {
        return service.getMembers(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JamiahDto create(
        @RequestParam(required = false) String uid,
        @Valid @RequestBody JamiahDto dto
    ) {
        return service.createJamiah(uid, dto);
    }

    @PutMapping("/{id}")
    public JamiahDto update(@PathVariable String id,
                            @RequestParam(required = false) String uid,
                            @Valid @RequestBody JamiahDto dto) {
        return service.update(id, dto, uid);
    }

    @PostMapping("/{id}/invite")
    public JamiahDto invite(@PathVariable String id,
                            @RequestParam(required = false) String uid) {
        return service.createOrRefreshInvitation(id, uid);
    }

    @PostMapping("/{id}/start")
    public JamiahCycle start(@PathVariable String id, @RequestParam String uid, @RequestBody StartRequest request) {
        return service.startCycle(id, uid, request.getOrder());
    }

    @GetMapping("/{id}/start-preview")
    public com.example.backend.jamiah.dto.StartPreviewDto preview(@PathVariable String id, @RequestParam String uid) {
        return service.previewStart(id, uid);
    }

    @GetMapping("/{id}/cycles")
    public java.util.List<JamiahCycle> cycles(@PathVariable String id) {
        return service.getCycles(id);
    }

    @PostMapping("/{id}/cycles/{cycleId}/pay")
    public JamiahPayment pay(@PathVariable String id,
                             @PathVariable Long cycleId,
                             @RequestParam String uid,
                             @RequestParam BigDecimal amount) {
        return service.recordPayment(cycleId, uid, amount);
    }

    @GetMapping("/{id}/cycles/{cycleId}/payments")
    public java.util.List<JamiahPayment> payments(@PathVariable String id,
                                                  @PathVariable Long cycleId,
                                                  @RequestParam String uid) {
        return service.getPayments(cycleId, uid);
    }

    @PostMapping("/{id}/cycles/{cycleId}/payments/{paymentId}/confirm-receipt")
    public JamiahPayment confirmPaymentReceipt(@PathVariable String id,
                                               @PathVariable Long cycleId,
                                               @PathVariable Long paymentId,
                                               @RequestParam String uid) {
        return service.confirmPaymentReceipt(cycleId, paymentId, uid);
    }

    @PostMapping("/join")
    public JamiahDto join(@RequestParam String code, @RequestParam String uid) {
        return service.joinByInvitation(code, uid);
    }

    @PostMapping("/{id}/join-public")
    public JamiahDto joinPublic(@PathVariable String id, @RequestParam String uid) {
        return service.joinPublic(id, uid);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id,
                       @RequestParam(required = false) String uid) {
        service.delete(id, uid);
    }

    static class StartRequest {
        private java.util.List<String> order;

        public java.util.List<String> getOrder() {
            return order;
        }

        public void setOrder(java.util.List<String> order) {
            this.order = order;
        }
    }
}
