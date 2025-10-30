package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.jamiah.Jamiah;

import static org.hamcrest.Matchers.hasItem;
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

    @Autowired
    UserProfileRepository userRepository;

    private String newUid() {
        return "u-" + java.util.UUID.randomUUID();
    }

    private UserProfile createUser(String uid) {
        return createUser(uid, uid);
    }

    private UserProfile createUser(String uid, String username) {
        return userRepository.findByUid(uid).orElseGet(() -> {
            UserProfile user = new UserProfile();
            user.setUid(uid);
            user.setUsername(username + "-" + uid);
            return userRepository.save(user);
        });
    }

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

        String userUid = newUid();
        createUser(userUid, "user1");

        mockMvc.perform(post("/api/jamiahs/join?code=" + invite.getInvitationCode() + "&uid=" + userUid))
                .andExpect(status().isOk());
    }

    @Test
    void invitationPreviewSuccess() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Previewable");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setMaxMembers(5);
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

        mockMvc.perform(get("/api/jamiahs/invite/" + invite.getInvitationCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Previewable"))
                .andExpect(jsonPath("$.publicId").value(created.getId().toString()))
                .andExpect(jsonPath("$.invitationExpiry").isNotEmpty());
    }

    @Test
    void invitationPreviewExpired() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("ExpiredPreview");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setMaxMembers(5);
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

        Jamiah entity = repository.findWithMembersByInvitationCode(invite.getInvitationCode()).orElseThrow();
        entity.setInvitationExpiry(LocalDate.now().minusDays(1));
        repository.save(entity);

        mockMvc.perform(get("/api/jamiahs/invite/" + invite.getInvitationCode()))
                .andExpect(status().isGone());
    }

    @Test
    void acceptInvitationSuccess() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Acceptable");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setMaxMembers(5);
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

        String inviteeUid = newUid();
        createUser(inviteeUid, "invitee");

        mockMvc.perform(post("/api/jamiahs/invite/" + invite.getInvitationCode() + "/accept?uid=" + inviteeUid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.getId().toString()));
    }

    @Test
    void acceptInvitationMemberLimitReached() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("FullGroup");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setMaxMembers(1);
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

        String existingUid = newUid();
        UserProfile existing = createUser(existingUid, "existing");

        Jamiah entity = repository.findWithMembersByInvitationCode(invite.getInvitationCode()).orElseThrow();
        entity.getMembers().add(existing);
        existing.getJamiahs().add(entity);
        repository.save(entity);
        userRepository.save(existing);

        String blockedUid = newUid();
        createUser(blockedUid, "blocked");

        mockMvc.perform(post("/api/jamiahs/invite/" + invite.getInvitationCode() + "/accept?uid=" + blockedUid))
                .andExpect(status().isBadRequest());
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

        String expiredUid = newUid();
        createUser(expiredUid, "user1");

        mockMvc.perform(post("/api/jamiahs/join?code=" + invite.getInvitationCode() + "&uid=" + expiredUid))
                .andExpect(status().isGone());
    }

    @Test
    void joinJamiahInvalid() throws Exception {
        mockMvc.perform(post("/api/jamiahs/join?code=INVALID&uid=u1"))
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
        dto.setMaxMembers(5);
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
                .andExpect(jsonPath("$.language").value("de"))
                .andExpect(jsonPath("$.maxMembers").value(5))
                .andExpect(jsonPath("$.currentMembers").value(0));
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

    @Test
    void deleteJamiahForbiddenForNonOwner() throws Exception {
        String ownerUid = newUid();
        createUser(ownerUid, "owner");

        JamiahDto dto = new JamiahDto();
        dto.setName("Protected");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        String response = mockMvc.perform(post("/api/jamiahs?uid=" + ownerUid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andReturn().getResponse().getContentAsString();
        JamiahDto created = objectMapper.readValue(response, JamiahDto.class);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/jamiahs/" + created.getId() + "?uid=other"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listPublicJamiahs() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("Public");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        mockMvc.perform(post("/api/jamiahs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/jamiahs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Public")));
    }

    @Test
    void joinPublicJamiah() throws Exception {
        JamiahDto dto = new JamiahDto();
        dto.setName("JoinPublic");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        String response = mockMvc.perform(post("/api/jamiahs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andReturn().getResponse().getContentAsString();
        JamiahDto created = objectMapper.readValue(response, JamiahDto.class);

        String joinerUid = newUid();
        createUser(joinerUid, "joiner");

        mockMvc.perform(post("/api/jamiahs/" + created.getId() + "/join-public")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"uid\":\"" + joinerUid + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.getId().toString()));
    }
}
