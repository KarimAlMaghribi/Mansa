package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.server.ResponseStatusException;
import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.jamiah.Jamiah;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({JamiahService.class, JamiahMapperImpl.class})
class JamiahServiceTest {

    @Autowired
    private JamiahService service;

    @Autowired
    private JamiahRepository repository;

    @Autowired
    private UserProfileRepository userRepository;

    @Test
    void createValidJamiah() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Test Group");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(5);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("10"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto saved = service.create(dto);
        assertNotNull(saved.getId());
    }

    @Test
    void createInvalidJamiah() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Bad");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(1);
        dto.setCycleCount(0);
        dto.setRateAmount(new BigDecimal("0"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now().minusDays(1));

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void joinByInvitationSuccess() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Joinable");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        JamiahDto invite = service.createOrRefreshInvitation(entity.getId());
        UserProfile user = new UserProfile();
        user.setUsername("user1");
        user.setUid("u1");
        userRepository.save(user);
        JamiahDto joined = service.joinByInvitation(invite.getInvitationCode(), "u1");
        assertEquals(invite.getInvitationCode(), joined.getInvitationCode());
    }

    @Test
    void joinByInvitationExpired() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Expired");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        JamiahDto invite = service.createOrRefreshInvitation(entity.getId());
        entity.setInvitationExpiry(LocalDate.now().minusDays(1));
        repository.save(entity);

        assertThrows(ResponseStatusException.class,
                () -> service.joinByInvitation(invite.getInvitationCode(), "u1"));
    }

    @Test
    void joinByInvitationInvalid() {
        assertThrows(ResponseStatusException.class,
                () -> service.joinByInvitation("INVALID", "u1"));
    }

    @Test
    void deleteJamiah() {
        JamiahDto dto = new JamiahDto();
        dto.setName("ToDelete");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto created = service.create(dto);
        service.delete(created.getId().toString());
        assertEquals(0, repository.count());
    }

    @Test
    void memberCountAndLimit() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Limited");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setMaxMembers(1);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        JamiahDto invite = service.createOrRefreshInvitation(entity.getId());

        UserProfile user1 = new UserProfile();
        user1.setUsername("user1");
        user1.setUid("u1");
        userRepository.save(user1);
        service.joinByInvitation(invite.getInvitationCode(), "u1");

        assertEquals(1, repository.countMembers(entity.getId()));

        UserProfile user2 = new UserProfile();
        user2.setUsername("user2");
        user2.setUid("u2");
        userRepository.save(user2);

        assertThrows(ResponseStatusException.class,
                () -> service.joinByInvitation(invite.getInvitationCode(), "u2"));
    }

    @Test
    void joinByInvitationAlreadyMember() {
        JamiahDto dto = new JamiahDto();
        dto.setName("ExistingMember");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        JamiahDto invite = service.createOrRefreshInvitation(entity.getId());

        UserProfile user = new UserProfile();
        user.setUsername("user1");
        user.setUid("u1");
        userRepository.save(user);

        service.joinByInvitation(invite.getInvitationCode(), "u1");
        service.joinByInvitation(invite.getInvitationCode(), "u1");

        assertEquals(1, repository.countMembers(entity.getId()));
    }
}
