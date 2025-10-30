package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.PaymentConfirmationDto;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.jamiah.dto.RoundDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{paymentId}/initiate")
    public PaymentDto initiate(@PathVariable Long paymentId, @RequestParam String uid) {
        return paymentService.initiatePayment(paymentId, uid);
    }

    @PostMapping("/{paymentId}/confirm")
    public PaymentConfirmationDto confirm(@PathVariable Long paymentId,
                                          @RequestParam String uid) {
        return paymentService.confirmPayment(paymentId, uid);
    }

    @PostMapping("/confirm-receipt")
    public RoundDto confirmReceipt(@RequestBody ReceiptConfirmationRequest request) {
        return paymentService.confirmReceipt(request.getJamiahId(), request.getCycleId(), request.getUid());
    }

    public static class ReceiptConfirmationRequest {
        private String jamiahId;
        private Long cycleId;
        private String uid;

        public String getJamiahId() {
            return jamiahId;
        }

        public void setJamiahId(String jamiahId) {
            this.jamiahId = jamiahId;
        }

        public Long getCycleId() {
            return cycleId;
        }

        public void setCycleId(Long cycleId) {
            this.cycleId = cycleId;
        }

        public String getUid() {
            return uid;
        }

        public void setUid(String uid) {
            this.uid = uid;
        }
    }
}
