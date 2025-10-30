package com.example.backend.jamiah.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class InvitationPreviewDto {
    private String name;
    private String publicId;
    private LocalDate invitationExpiry;
}
