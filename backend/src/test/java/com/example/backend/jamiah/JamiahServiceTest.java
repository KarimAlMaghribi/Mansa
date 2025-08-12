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
import java.util.List;

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
    void findByPublicIdPersists() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Persist");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(5);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("10"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto saved = service.create(dto);
        Jamiah entity = repository.findByPublicId(saved.getId()).orElse(null);
        assertNotNull(entity);
        java.util.UUID legacy = java.util.UUID.nameUUIDFromBytes(entity.getId().toString().getBytes());
        assertNotEquals(legacy, entity.getPublicId());
    }

    @Test
    void legacyPublicIdFallbackWorks() {
        JamiahDto dto = new JamiahDto();
        dto.setName("Legacy");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(5);
        dto.setCycleCount(2);
        dto.setRateAmount(new BigDecimal("10"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto saved = service.create(dto);
        Jamiah entity = repository.findAll().get(0);
        String legacy = java.util.UUID.nameUUIDFromBytes(entity.getId().toString().getBytes()).toString();

        JamiahDto fetched = service.findByPublicId(legacy);
        assertEquals(saved.getId().toString(), fetched.getId().toString());
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

    @Test
    void createJamiahAddsCreator() {
        UserProfile user = new UserProfile();
        user.setUsername("creator");
        user.setUid("uid123");
        userRepository.save(user);

        JamiahDto dto = new JamiahDto();
        dto.setName("Creators Group");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.createJamiah("uid123", dto);
        Jamiah jamiah = repository.findAll().get(0);

        assertEquals(1, jamiah.getMembers().size());
        assertTrue(jamiah.getMembers().contains(user));
        assertEquals("uid123", jamiah.getOwnerId());
    }

    @Test
    void newJamiahHasNoStartDate() {
        UserProfile user = new UserProfile();
        user.setUsername("owner2");
        user.setUid("owner2");
        userRepository.save(user);

        JamiahDto dto = new JamiahDto();
        dto.setName("NoStartDate");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.createJamiah("owner2", dto);
        Jamiah jamiah = repository.findAll().get(0);
        assertNull(jamiah.getStartDate());
    }

    @Test
    void onlyOwnerCanModify() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("ownerA");
        userRepository.save(owner);

        JamiahDto dto = new JamiahDto();
        dto.setName("Protected");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto created = service.createJamiah("ownerA", dto);

        assertThrows(ResponseStatusException.class,
                () -> service.delete(created.getId().toString(), "intruder"));
    }

    @Test
    void getJamiahsForUserReturnsOwnedJamiahs() {
        UserProfile user = new UserProfile();
        user.setUsername("owner");
        user.setUid("owner1");
        userRepository.save(user);

        JamiahDto dto = new JamiahDto();
        dto.setName("Owned Group");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        service.createJamiah("owner1", dto);

        List<JamiahDto> jamiahs = service.getJamiahsForUser("owner1");

        assertEquals(1, jamiahs.size());
        assertEquals("Owned Group", jamiahs.get(0).getName());
    }

    @Test
    void findAllPublicReturnsOnlyPublicJamiahs() {
        JamiahDto pub = new JamiahDto();
        pub.setName("Public");
        pub.setIsPublic(true);
        pub.setMaxGroupSize(3);
        pub.setCycleCount(1);
        pub.setRateAmount(new BigDecimal("5"));
        pub.setRateInterval(RateInterval.MONTHLY);
        pub.setStartDate(LocalDate.now());

        JamiahDto priv = new JamiahDto();
        priv.setName("Private");
        priv.setIsPublic(false);
        priv.setMaxGroupSize(3);
        priv.setCycleCount(1);
        priv.setRateAmount(new BigDecimal("5"));
        priv.setRateInterval(RateInterval.MONTHLY);
        priv.setStartDate(LocalDate.now());

        service.create(pub);
        service.create(priv);

        List<JamiahDto> all = service.findAllPublic();
        assertEquals(1, all.size());
        assertEquals("Public", all.get(0).getName());
    }

    @Test
    void joinPublicAddsMember() {
        JamiahDto dto = new JamiahDto();
        dto.setName("JoinablePublic");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto created = service.create(dto);
        UserProfile user = new UserProfile();
        user.setUsername("member");
        user.setUid("m1");
        userRepository.save(user);

        JamiahDto joined = service.joinPublic(created.getId().toString(), "m1");
        assertEquals(1, repository.countMembers(repository.findAll().get(0).getId()));
        assertEquals(created.getId(), joined.getId());
    }

    @Test
    void getMembersReturnsAllMembers() {
        JamiahDto dto = new JamiahDto();
        dto.setName("MemberList");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());

        JamiahDto created = service.create(dto);

        UserProfile u1 = new UserProfile();
        u1.setUsername("user1");
        u1.setUid("uid1");
        userRepository.save(u1);
        service.joinPublic(created.getId().toString(), "uid1");

        UserProfile u2 = new UserProfile();
        u2.setUsername("user2");
        u2.setUid("uid2");
        userRepository.save(u2);
        service.joinPublic(created.getId().toString(), "uid2");

        java.util.List<UserProfile> members = service.getMembers(created.getId().toString());
        assertEquals(2, members.size());
    }
}
