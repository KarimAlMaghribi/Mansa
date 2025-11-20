package com.example.backend.wallet;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wallets/payment-intents")
@CrossOrigin(origins = "*")
public class WalletWebhookController {

    private final WalletService walletService;

    public WalletWebhookController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping("/{paymentIntentId}/refresh")
    public WalletStatusResponse refresh(@PathVariable String paymentIntentId) {
        return walletService.refreshPaymentIntent(paymentIntentId);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> payload) {
        Object type = payload.get("type");
        if (type instanceof String && ((String) type).startsWith("payment_intent.")) {
            Object data = payload.get("data");
            if (data instanceof Map<?, ?> dataMap) {
                Object object = dataMap.get("object");
                if (object instanceof Map<?, ?> objectMap) {
                    Object id = objectMap.get("id");
                    if (id instanceof String paymentIntentId && !paymentIntentId.isBlank()) {
                        walletService.refreshPaymentIntent(paymentIntentId);
                    }
                }
            }
        }
        return ResponseEntity.ok("processed");
    }
}
