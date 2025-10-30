package com.example.backend.wallet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/jamiahs/{jamiahId}/wallets")
@Validated
@CrossOrigin(origins = "*")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WalletStatusResponse createWallet(@PathVariable("jamiahId") String jamiahId,
                                             @RequestParam String uid,
                                             @Valid @RequestBody(required = false) CreateWalletRequest request) {
        CreateWalletRequest effective = request != null ? request : new CreateWalletRequest();
        return walletService.createWallet(jamiahId,
                uid,
                effective.getReturnUrl(),
                effective.getRefreshUrl(),
                Boolean.TRUE.equals(effective.getCreateDashboardSession()));
    }

    @PostMapping("/top-up")
    public WalletStatusResponse topUp(@PathVariable("jamiahId") String jamiahId,
                                      @RequestParam String uid,
                                      @Valid @RequestBody AmountRequest request) {
        return walletService.topUp(jamiahId,
                uid,
                request.getAmount(),
                request.getReturnUrl(),
                request.getRefreshUrl(),
                Boolean.TRUE.equals(request.getCreateDashboardSession()));
    }

    @PostMapping("/withdraw")
    public WalletStatusResponse withdraw(@PathVariable("jamiahId") String jamiahId,
                                         @RequestParam String uid,
                                         @Valid @RequestBody AmountRequest request) {
        return walletService.withdraw(jamiahId,
                uid,
                request.getAmount(),
                request.getReturnUrl(),
                request.getRefreshUrl(),
                Boolean.TRUE.equals(request.getCreateDashboardSession()));
    }

    @GetMapping("/status")
    public WalletStatusResponse status(@PathVariable("jamiahId") String jamiahId,
                                       @RequestParam String uid,
                                       @RequestParam(required = false) String returnUrl,
                                       @RequestParam(required = false) String refreshUrl,
                                       @RequestParam(name = "dashboardSession", required = false, defaultValue = "false")
                                       boolean dashboardSession) {
        return walletService.getStatus(jamiahId, uid, returnUrl, refreshUrl, dashboardSession);
    }

    public static class CreateWalletRequest {
        private String returnUrl;
        private String refreshUrl;
        private Boolean createDashboardSession;

        public String getReturnUrl() {
            return returnUrl;
        }

        public void setReturnUrl(String returnUrl) {
            this.returnUrl = returnUrl;
        }

        public String getRefreshUrl() {
            return refreshUrl;
        }

        public void setRefreshUrl(String refreshUrl) {
            this.refreshUrl = refreshUrl;
        }

        public Boolean getCreateDashboardSession() {
            return createDashboardSession;
        }

        public void setCreateDashboardSession(Boolean createDashboardSession) {
            this.createDashboardSession = createDashboardSession;
        }
    }

    public static class AmountRequest extends CreateWalletRequest {
        @NotNull
        @DecimalMin(value = "0.01", inclusive = true)
        private BigDecimal amount;

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}
