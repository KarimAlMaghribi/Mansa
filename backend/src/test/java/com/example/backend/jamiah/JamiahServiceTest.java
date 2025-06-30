package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({JamiahService.class, JamiahMapperImpl.class})
class JamiahServiceTest {

    @Autowired
    private JamiahService service;

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
}
