package com.example.backend.wallet;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.ApiResource;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private final WalletService walletService;
    private final String webhookSecret;

    public StripeWebhookController(WalletService walletService,
                                   @Value("${stripe.webhook-secret:}") String webhookSecret) {
        this.walletService = walletService;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody String payload,
                                              @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        Event event = deserializeEvent(payload, signature);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if ("payment_intent.succeeded".equals(event.getType())
                || "payment_intent.payment_failed".equals(event.getType())
                || "payment_intent.canceled".equals(event.getType())) {
            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
            Optional<StripeObject> objectOptional = deserializer.getObject();
            if (objectOptional.isPresent() && objectOptional.get() instanceof PaymentIntent paymentIntent) {
                walletService.handlePaymentIntentUpdate(paymentIntent);
            }
        }
        return ResponseEntity.ok().build();
    }

    private Event deserializeEvent(String payload, String signature) {
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            try {
                return Webhook.constructEvent(payload, signature, webhookSecret);
            } catch (SignatureVerificationException ex) {
                return null;
            }
        }
        return ApiResource.GSON.fromJson(payload, Event.class);
    }
}
