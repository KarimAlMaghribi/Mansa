package com.example.backend.payment;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Authenticator;
import com.stripe.net.RequestOptions;
import com.stripe.net.StripeRequest;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;

class StripePaymentProviderTest {

    @Test
    void createPaymentIntentUsesSandboxHeaderWhenConfigured() throws StripeException {
        StripePaymentProvider provider = new StripePaymentProvider("sk_test", "sbx_123");
        Map<String, Object> params = Map.of("amount", 1000L);

        try (MockedStatic<PaymentIntent> paymentIntent = Mockito.mockStatic(PaymentIntent.class)) {
            paymentIntent.when(() -> PaymentIntent.create(eq(params), any(RequestOptions.class)))
                    .thenAnswer(invocation -> {
                        RequestOptions options = invocation.getArgument(1);
                        assertSandboxBehavior(options, "sk_test", "sbx_123");
                        return Mockito.mock(PaymentIntent.class);
                    });

            provider.createPaymentIntent(params);

            paymentIntent.verify(() -> PaymentIntent.create(eq(params), any(RequestOptions.class)));
        }
    }

    @Test
    void retrievePaymentIntentOmitsSandboxHeaderWhenNotConfigured() throws StripeException {
        StripePaymentProvider provider = new StripePaymentProvider("sk_test", null);

        try (MockedStatic<PaymentIntent> paymentIntent = Mockito.mockStatic(PaymentIntent.class)) {
            paymentIntent.when(() -> PaymentIntent.retrieve(eq("pi_123"), any(RequestOptions.class)))
                    .thenAnswer(invocation -> {
                        RequestOptions options = invocation.getArgument(1);
                        assertSandboxBehavior(options, "sk_test", null);
                        return Mockito.mock(PaymentIntent.class);
                    });

            provider.retrievePaymentIntent("pi_123");

            paymentIntent.verify(() -> PaymentIntent.retrieve(eq("pi_123"), any(RequestOptions.class)));
        }
    }

    @Test
    void updatePaymentIntentPropagatesSandboxHeader() throws StripeException {
        StripePaymentProvider provider = new StripePaymentProvider("sk_test", "sbx_456");
        Map<String, Object> params = Map.of("description", "test");

        try (MockedStatic<PaymentIntent> paymentIntentStatic = Mockito.mockStatic(PaymentIntent.class)) {
            PaymentIntent intent = Mockito.mock(PaymentIntent.class);
            final RequestOptions[] captured = new RequestOptions[1];
            paymentIntentStatic.when(() -> PaymentIntent.retrieve(eq("pi_456"), any(RequestOptions.class)))
                    .thenAnswer(invocation -> {
                        RequestOptions options = invocation.getArgument(1);
                        captured[0] = options;
                        assertSandboxBehavior(options, "sk_test", "sbx_456");
                        Mockito.when(intent.update(eq(params), eq(options))).thenReturn(intent);
                        return intent;
                    });

            provider.updatePaymentIntent("pi_456", params);

            paymentIntentStatic.verify(() -> PaymentIntent.retrieve(eq("pi_456"), any(RequestOptions.class)));
            Mockito.verify(intent).update(eq(params), eq(captured[0]));
        }
    }

    private void assertSandboxBehavior(RequestOptions options, String apiKey, String sandboxId) throws StripeException {
        Authenticator authenticator = options.getAuthenticator();
        assertNotNull(authenticator);
        StripeRequest initial = Mockito.mock(StripeRequest.class);
        StripeRequest afterAuth = Mockito.mock(StripeRequest.class);
        StripeRequest finalRequest = Mockito.mock(StripeRequest.class);

        Mockito.when(initial.withAdditionalHeader(eq("Authorization"), eq("Bearer " + apiKey)))
                .thenReturn(afterAuth);
        if (sandboxId != null) {
            Mockito.when(afterAuth.withAdditionalHeader(eq(StripePaymentProvider.STRIPE_SANDBOX_HEADER), eq(sandboxId)))
                    .thenReturn(finalRequest);
            StripeRequest result = authenticator.authenticate(initial);
            Mockito.verify(afterAuth).withAdditionalHeader(eq(StripePaymentProvider.STRIPE_SANDBOX_HEADER), eq(sandboxId));
            assertEquals(finalRequest, result);
        } else {
            Mockito.when(afterAuth.withAdditionalHeader(eq(StripePaymentProvider.STRIPE_SANDBOX_HEADER), any(String.class)))
                    .thenReturn(finalRequest);
            StripeRequest result = authenticator.authenticate(initial);
            Mockito.verify(afterAuth, never())
                    .withAdditionalHeader(eq(StripePaymentProvider.STRIPE_SANDBOX_HEADER), any(String.class));
            assertEquals(afterAuth, result);
        }
    }
}
