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
import java.time.LocalDate;

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
        JamiahCycle completed = cycleRepository.findById(cycle.getId()).orElseThrow();
        assertTrue(completed.getCompleted());
        JamiahCycle next = cycleRepository.findByJamiahId(jamiah.getId()).stream()
                .filter(c -> c.getCycleNumber() == 2)
                .findFirst()
                .orElse(null);
        assertNotNull(next);
        assertEquals(completed.getStartDate().plusMonths(1), next.getStartDate());
    }

    @Test
    void previewStartCalculatesEndDate() {
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

        com.example.backend.jamiah.dto.StartPreviewDto preview = service.previewStart(created.getId().toString(), "u1");
        assertEquals(LocalDate.now().plusMonths(1), preview.getExpectedEndDate());
    }

    @Test
    void recordPaymentIsIdempotent() {
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
        JamiahPayment first = service.recordPayment(cycle.getId(), "u1", new BigDecimal("5"));
        JamiahPayment second = service.recordPayment(cycle.getId(), "u1", new BigDecimal("5"));
        assertEquals(first.getId(), second.getId());
        assertEquals(1, paymentRepository.countByCycleId(cycle.getId()));
    }

    @Test
    void recordPaymentUpdatesExistingUnconfirmed() {
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

        JamiahPayment existing = new JamiahPayment();
        existing.setCycle(cycle);
        existing.setUser(member);
        existing.setAmount(new BigDecimal("5"));
        paymentRepository.save(existing);

        JamiahPayment updated = service.recordPayment(cycle.getId(), "u2", new BigDecimal("5"));
        assertEquals(existing.getId(), updated.getId());
        assertTrue(updated.getConfirmed());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void getPaymentsReturnsAccordingToRole() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile recipient = new UserProfile();
        recipient.setUsername("rec");
        recipient.setUid("u2");
        userRepository.save(recipient);

        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u3");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1",
                java.util.Arrays.asList("u2", "u3", "u1"));

        service.recordPayment(cycle.getId(), "u1", new BigDecimal("5"));
        service.recordPayment(cycle.getId(), "u2", new BigDecimal("5"));
        service.recordPayment(cycle.getId(), "u3", new BigDecimal("5"));

        assertEquals(3, service.getPayments(cycle.getId(), "u1").size());
        assertEquals(3, service.getPayments(cycle.getId(), "u2").size());
        assertEquals(1, service.getPayments(cycle.getId(), "u3").size());
    }
}
