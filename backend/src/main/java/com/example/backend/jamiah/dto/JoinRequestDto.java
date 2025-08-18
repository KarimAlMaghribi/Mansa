package com.example.backend.jamiah.dto;

import lombok.Data;

@Data
public class JoinRequestDto {
    private Long id;
    private String jamiahId;
    private String userUid;
    private String motivation;
    private String status;
}
