package com.example.backend.payment;

import com.stripe.exception.AuthenticationException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Authenticator;
import com.stripe.net.BearerTokenAuthenticator;
import com.stripe.net.RequestOptions;
import com.stripe.net.StripeRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Wrapper around Stripe's PaymentIntent APIs that builds per-request options with
 * optional sandbox selection.
 */
@Component
public class StripePaymentProvider {

    static final String STRIPE_SANDBOX_HEADER = "Stripe-Sandbox";
    private static final String MISSING_API_KEY_MESSAGE =
            "No API key provided. Set your API key using `Stripe.apiKey = \"<API-KEY>\"`. "
                    + "You can generate API keys from the Stripe Dashboard. See https://stripe.com/docs/api/authentication "
                    + "for details or contact support at https://support.stripe.com/email if you have any questions.";

    private final String sandboxId;
    private final RequestOptions requestOptions;

    public StripePaymentProvider(
            @Value("${stripe.api-key:}") String apiKey,
            @Value("${stripe.sandbox-id:}") String sandboxId) {
        RequestOptions.RequestOptionsBuilder builder = RequestOptions.builder();
        builder.setApiKey(apiKey);
        String normalizedApiKey = builder.getApiKey();
        this.sandboxId = (sandboxId == null || sandboxId.isBlank()) ? null : sandboxId;
        if (this.sandboxId != null || normalizedApiKey != null) {
            builder.setAuthenticator(new SandboxAwareAuthenticator(normalizedApiKey, this.sandboxId));
        }
        this.requestOptions = builder.build();
    }

    RequestOptions getRequestOptions() {
        return requestOptions;
    }

    public PaymentIntent createPaymentIntent(Map<String, Object> params) throws StripeException {
        return PaymentIntent.create(params, requestOptions);
    }

    public PaymentIntent updatePaymentIntent(String paymentIntentId, Map<String, Object> params)
            throws StripeException {
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId, requestOptions);
        return paymentIntent.update(params, requestOptions);
    }

    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException {
        return PaymentIntent.retrieve(paymentIntentId, requestOptions);
    }

    public String getSandboxId() {
        return sandboxId;
    }

    static final class SandboxAwareAuthenticator implements Authenticator {
        private final BearerTokenAuthenticator delegate;
        private final String sandboxId;

        SandboxAwareAuthenticator(String apiKey, String sandboxId) {
            this.delegate = apiKey != null ? new BearerTokenAuthenticator(apiKey) : null;
            this.sandboxId = (sandboxId == null || sandboxId.isBlank()) ? null : sandboxId;
        }

        @Override
        public StripeRequest authenticate(StripeRequest request) throws StripeException {
            StripeRequest authenticated;
            if (delegate != null) {
                authenticated = delegate.authenticate(request);
            } else {
                throw new AuthenticationException(MISSING_API_KEY_MESSAGE, null, null, Integer.valueOf(0));
            }
            if (sandboxId != null) {
                authenticated = authenticated.withAdditionalHeader(STRIPE_SANDBOX_HEADER, sandboxId);
            }
            return authenticated;
        }
    }
}
