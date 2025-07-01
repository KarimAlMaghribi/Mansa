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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

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

    @Test
    void getJamiahById() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Detail");
        dto.setDescription("A group");
        dto.setLanguage("de");
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

        mockMvc.perform(get("/api/jamiahs/" + created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("A group"))
                .andExpect(jsonPath("$.language").value("de"));
    }

    @Test
    void deleteJamiah() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Delete");
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

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/jamiahs/" + created.getId()))
                .andExpect(status().isNoContent());
    }
}
