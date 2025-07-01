package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.jamiah.Jamiah;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class JamiahControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JamiahRepository repository;

    @Test
    void createJamiahSuccess() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Valid Group");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        mockMvc.perform(post("/api/jamiahs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createJamiahValidationFail() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Bad");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(1);
        dto.setCycleCount(0);
        dto.setRateAmount(new BigDecimal("0"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now().minusDays(1));

        mockMvc.perform(post("/api/jamiahs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void joinJamiahSuccess() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Joinable");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        String response = mockMvc.perform(post("/api/jamiahs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andReturn().getResponse().getContentAsString();
        JamiahDto created = objectMapper.readValue(response, JamiahDto.class);

        String inviteResp = mockMvc.perform(post("/api/jamiahs/" + created.getId() + "/invite"))
                .andReturn().getResponse().getContentAsString();
        JamiahDto invite = objectMapper.readValue(inviteResp, JamiahDto.class);

        mockMvc.perform(post("/api/jamiahs/join?code=" + invite.getInvitationCode()))
                .andExpect(status().isOk());
    }

    @Test
    void joinJamiahExpired() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Expired");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        String response = mockMvc.perform(post("/api/jamiahs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andReturn().getResponse().getContentAsString();
        JamiahDto created = objectMapper.readValue(response, JamiahDto.class);

        String inviteResp = mockMvc.perform(post("/api/jamiahs/" + created.getId() + "/invite"))
                .andReturn().getResponse().getContentAsString();
        JamiahDto invite = objectMapper.readValue(inviteResp, JamiahDto.class);

        Jamiah entity = repository.findByInvitationCode(invite.getInvitationCode()).get();
        entity.setInvitationExpiry(LocalDate.now().minusDays(1));
        repository.save(entity);

        mockMvc.perform(post("/api/jamiahs/join?code=" + invite.getInvitationCode()))
                .andExpect(status().isGone());
    }

    @Test
    void joinJamiahInvalid() throws Exception {
        mockMvc.perform(post("/api/jamiahs/join?code=INVALID"))
                .andExpect(status().isNotFound());
    }
}
