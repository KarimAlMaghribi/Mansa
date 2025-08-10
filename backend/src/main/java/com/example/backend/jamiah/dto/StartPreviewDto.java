package com.example.backend.jamiah.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class StartPreviewDto {
    private List<MemberInfo> order;
    private BigDecimal payoutPerInterval;
    private Integer rounds;
    private LocalDate expectedEndDate;

    @Data
    public static class MemberInfo {
        private String uid;
        private String username;
        private String firstName;
        private String lastName;
    }
}
