package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.util.InviteCodeGenerator;
import com.example.backend.jamiah.JamiahCycleRepository;
import com.example.backend.jamiah.JamiahPaymentRepository;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class JamiahService {
    private final JamiahRepository repository;
    private final JamiahMapper mapper;
    private final com.example.backend.UserProfileRepository userRepository;
    private final JamiahCycleRepository cycleRepository;
    private final JamiahPaymentRepository paymentRepository;

    private static final Logger log = LoggerFactory.getLogger(JamiahService.class);

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000L;
    private final java.util.concurrent.ConcurrentHashMap<String, RateLimitEntry> attempts = new java.util.concurrent.ConcurrentHashMap<>();

    private static class RateLimitEntry {
        long windowStart = System.currentTimeMillis();
        int count = 0;
    }

    public JamiahService(JamiahRepository repository,
                         JamiahMapper mapper,
                         com.example.backend.UserProfileRepository userRepository,
                         JamiahCycleRepository cycleRepository,
                         JamiahPaymentRepository paymentRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.userRepository = userRepository;
        this.cycleRepository = cycleRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<JamiahDto> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve all public Jamiahs.
     */
    public List<JamiahDto> findAllPublic() {
        return repository.findByIsPublicTrue().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public JamiahDto create(JamiahDto dto) {
        return create(dto, null);
    }

    public JamiahDto create(JamiahDto dto, String uid) {
        validateParameters(dto);
        Jamiah entity = mapper.toEntity(dto);
        if (uid != null) {
            com.example.backend.UserProfile user = userRepository.findByUid(uid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            entity.getMembers().add(user);
            user.getJamiahs().add(entity);
        }
        Jamiah saved = repository.save(entity);
        return mapper.toDto(saved);
    }

    /**
     * Create a new Jamiah for the given owner.
     */
    public JamiahDto createJamiah(String ownerUid, JamiahDto dto) {
        validateParameters(dto);
        Jamiah j = mapper.toEntity(dto);
        j.setOwnerId(ownerUid);
        if (ownerUid != null) {
            com.example.backend.UserProfile user = userRepository.findByUid(ownerUid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            j.getMembers().add(user);
            user.getJamiahs().add(j);
        }
        Jamiah saved = repository.save(j);
        return mapper.toDto(saved);
    }

    public JamiahDto update(Long id, JamiahDto dto) {
        validateParameters(dto);
        Jamiah entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setLanguage(dto.getLanguage());
        entity.setIsPublic(dto.getIsPublic());
        entity.setMaxGroupSize(dto.getMaxGroupSize());
        entity.setMaxMembers(dto.getMaxMembers());
        entity.setCycleCount(dto.getCycleCount());
        entity.setRateAmount(dto.getRateAmount());
        entity.setRateInterval(dto.getRateInterval());
        entity.setStartDate(dto.getStartDate());
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto update(String publicId, JamiahDto dto, String uid) {
        validateParameters(dto);
        Jamiah entity = getByPublicId(publicId);
        ensureOwner(entity, uid);
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setLanguage(dto.getLanguage());
        entity.setIsPublic(dto.getIsPublic());
        entity.setMaxGroupSize(dto.getMaxGroupSize());
        entity.setMaxMembers(dto.getMaxMembers());
        entity.setCycleCount(dto.getCycleCount());
        entity.setRateAmount(dto.getRateAmount());
        entity.setRateInterval(dto.getRateInterval());
        entity.setStartDate(dto.getStartDate());
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto update(String publicId, JamiahDto dto) {
        return update(publicId, dto, null);
    }

    public JamiahDto createOrRefreshInvitation(Long id) {
        Jamiah entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        entity.setInvitationCode(InviteCodeGenerator.generate());
        entity.setInvitationExpiry(LocalDate.now().plusDays(1));
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto createOrRefreshInvitation(String publicId, String uid) {
        Jamiah entity = getByPublicId(publicId);
        ensureOwner(entity, uid);
        entity.setInvitationCode(InviteCodeGenerator.generate());
        entity.setInvitationExpiry(LocalDate.now().plusDays(1));
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto createOrRefreshInvitation(String publicId) {
        return createOrRefreshInvitation(publicId, null);
    }

    public JamiahDto findByPublicId(String publicId) {
        Jamiah entity = getByPublicId(publicId);
        return mapper.toDto(entity);
    }

    /**
     * Retrieve all Jamiahs the specified user is a member of.
     */
    public java.util.List<JamiahDto> getJamiahsForUser(String uid) {
        return repository.findByMemberUid(uid).stream()
                .map(mapper::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public JamiahDto joinByInvitation(String code, String uid) {
        log.info("Join attempt with code {} for uid {}", code, uid);
        if (isRateLimited(code)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        }
        Jamiah entity = repository.findWithMembersByInvitationCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (entity.getInvitationExpiry() != null && entity.getInvitationExpiry().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.GONE);
        }
        com.example.backend.UserProfile user = userRepository.findByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!entity.getMembers().contains(user)) {
            if (entity.getMaxMembers() != null && entity.getMembers().size() >= entity.getMaxMembers()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member limit reached");
            }
            entity.getMembers().add(user);
            user.getJamiahs().add(entity);
            repository.save(entity);
        }
        return mapper.toDto(entity);
    }

    /**
     * Join a public Jamiah without invitation code.
     */
    public JamiahDto joinPublic(String publicId, String uid) {
        Jamiah entity = getByPublicId(publicId);
        if (!Boolean.TRUE.equals(entity.getIsPublic())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jamiah is not public");
        }
        com.example.backend.UserProfile user = userRepository.findByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!entity.getMembers().contains(user)) {
            if (entity.getMaxMembers() != null && entity.getMembers().size() >= entity.getMaxMembers()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member limit reached");
            }
            entity.getMembers().add(user);
            user.getJamiahs().add(entity);
            repository.save(entity);
        }
        return mapper.toDto(entity);
    }

    /**
     * Retrieve all members of the Jamiah identified by the public id.
     */
    public java.util.List<com.example.backend.UserProfile> getMembers(String publicId) {
        Jamiah base = getByPublicId(publicId);
        Jamiah withMembers = repository.findWithMembersById(base.getId())
                .orElse(base);
        return new java.util.ArrayList<>(withMembers.getMembers());
    }

    public void delete(String publicId, String uid) {
        Jamiah entity = getByPublicId(publicId);
        ensureOwner(entity, uid);
        repository.delete(entity);
    }

    public void delete(String publicId) {
        delete(publicId, null);
    }

    private boolean isRateLimited(String key) {
        long now = System.currentTimeMillis();
        RateLimitEntry entry = attempts.computeIfAbsent(key, k -> new RateLimitEntry());
        synchronized (entry) {
            if (now - entry.windowStart > WINDOW_MS) {
                entry.windowStart = now;
                entry.count = 0;
            }
            entry.count++;
            return entry.count > MAX_ATTEMPTS;
        }
    }

    private void ensureOwner(Jamiah jamiah, String uid) {
        if (jamiah.getOwnerId() == null) {
            return;
        }
        if (uid == null || !jamiah.getOwnerId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private Jamiah getByPublicId(String publicId) {
        java.util.UUID uuid = java.util.UUID.fromString(publicId);
        return repository.findAll().stream()
                .filter(j -> java.util.UUID.nameUUIDFromBytes(j.getId().toString().getBytes()).equals(uuid))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public JamiahCycle startCycle(String jamiahPublicId, String uid) {
        Jamiah jamiah = getByPublicId(jamiahPublicId);
        ensureOwner(jamiah, uid);
        if (jamiah.getStartDate() == null) {
            jamiah.setStartDate(LocalDate.now());
            repository.save(jamiah);
        }
        JamiahCycle cycle = new JamiahCycle();
        cycle.setJamiah(jamiah);
        cycle.setCycleNumber((int) (cycleRepository.countByJamiahId(jamiah.getId()) + 1));
        cycle.setStartDate(LocalDate.now());
        cycle.setCompleted(false);
        return cycleRepository.save(cycle);
    }

    public java.util.List<JamiahCycle> getCycles(String jamiahPublicId) {
        Jamiah jamiah = getByPublicId(jamiahPublicId);
        return cycleRepository.findByJamiahId(jamiah.getId());
    }

    public JamiahPayment recordPayment(Long cycleId, String uid, BigDecimal amount) {
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        com.example.backend.UserProfile user = userRepository.findByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        JamiahPayment payment = new JamiahPayment();
        payment.setCycle(cycle);
        payment.setUser(user);
        payment.setAmount(amount);
        payment.setPaidAt(java.time.LocalDateTime.now());
        JamiahPayment saved = paymentRepository.save(payment);

        long memberCount = repository.countMembers(cycle.getJamiah().getId());
        long paidCount = paymentRepository.countByCycleId(cycleId);
        if (memberCount > 0 && paidCount >= memberCount) {
            cycle.setCompleted(true);
            cycleRepository.save(cycle);
        }
        return saved;
    }

    public java.util.List<JamiahPayment> getPayments(Long cycleId) {
        return paymentRepository.findByCycleId(cycleId);
    }

    void validateParameters(JamiahDto dto) {
        if (dto.getMaxGroupSize() != null && dto.getMaxGroupSize() < 2) {
            throw new IllegalArgumentException("maxGroupSize must be >= 2");
        }
        if (dto.getMaxMembers() != null && dto.getMaxMembers() < 1) {
            throw new IllegalArgumentException("maxMembers must be >= 1");
        }
        if (dto.getCycleCount() != null && dto.getCycleCount() < 1) {
            throw new IllegalArgumentException("cycleCount must be >= 1");
        }
        if (dto.getRateAmount() != null && dto.getRateAmount().doubleValue() <= 0) {
            throw new IllegalArgumentException("rateAmount must be > 0");
        }
        if (dto.getStartDate() != null && dto.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("startDate must be today or in the future");
        }
        if (dto.getRateInterval() == null) {
            throw new IllegalArgumentException("rateInterval must not be null");
        }
        if (dto.getIsPublic() == null) {
            throw new IllegalArgumentException("isPublic must not be null");
        }
    }
}
