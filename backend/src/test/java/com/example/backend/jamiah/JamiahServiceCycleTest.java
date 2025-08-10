package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.JamiahPayment;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class JamiahServiceCycleTest {
    @Autowired
    JamiahService service;
    @Autowired
    JamiahRepository jamiahRepository;
    @Autowired
    JamiahCycleRepository cycleRepository;
    @Autowired
    JamiahPaymentRepository paymentRepository;
    @Autowired
    UserProfileRepository userRepository;

    private JamiahDto createJamiah(String ownerUid) {
        JamiahDto dto = new JamiahDto();
        dto.setName("Cycle Test");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        return service.createJamiah(ownerUid, dto);
    }

    @Test
    void startCycleSetsStartDate() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        Jamiah jamiahUpdated = jamiahRepository.findAll().get(0);
        assertNotNull(jamiahUpdated.getStartDate());
        assertEquals(1, cycle.getCycleNumber());
    }

    @Test
    void paymentsCompleteCycle() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));
        JamiahPayment p1 = service.recordPayment(cycle.getId(), "u1", new BigDecimal("5"));
        JamiahPayment p2 = service.recordPayment(cycle.getId(), "u2", new BigDecimal("5"));
        assertFalse(cycleRepository.findById(cycle.getId()).get().getCompleted());
        service.confirmPaymentReceipt(cycle.getId(), p1.getId(), "u1");
        service.confirmPaymentReceipt(cycle.getId(), p2.getId(), "u1");
        assertTrue(cycleRepository.findById(cycle.getId()).get().getCompleted());
    }
}
