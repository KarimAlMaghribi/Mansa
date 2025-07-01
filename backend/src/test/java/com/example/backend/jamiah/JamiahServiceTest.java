package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.server.ResponseStatusException;

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

        JamiahDto created = service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        JamiahDto invite = service.createOrRefreshInvitation(entity.getId());
        JamiahDto joined = service.joinByInvitation(invite.getInvitationCode());
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
                () -> service.joinByInvitation(invite.getInvitationCode()));
    }

    @Test
    void joinByInvitationInvalid() {
        assertThrows(ResponseStatusException.class,
                () -> service.joinByInvitation("INVALID"));
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
}
