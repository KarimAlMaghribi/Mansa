package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.util.InviteCodeGenerator;
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

    private static final Logger log = LoggerFactory.getLogger(JamiahService.class);

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000L;
    private final java.util.concurrent.ConcurrentHashMap<String, RateLimitEntry> attempts = new java.util.concurrent.ConcurrentHashMap<>();

    private static class RateLimitEntry {
        long windowStart = System.currentTimeMillis();
        int count = 0;
    }

    public JamiahService(JamiahRepository repository, JamiahMapper mapper, com.example.backend.UserProfileRepository userRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.userRepository = userRepository;
    }

    public List<JamiahDto> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public JamiahDto create(JamiahDto dto) {
        validateParameters(dto);
        Jamiah entity = mapper.toEntity(dto);
        Jamiah saved = repository.save(entity);
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

    public JamiahDto update(String publicId, JamiahDto dto) {
        validateParameters(dto);
        Jamiah entity = getByPublicId(publicId);
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

    public JamiahDto createOrRefreshInvitation(Long id) {
        Jamiah entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        entity.setInvitationCode(InviteCodeGenerator.generate());
        entity.setInvitationExpiry(LocalDate.now().plusDays(1));
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto createOrRefreshInvitation(String publicId) {
        Jamiah entity = getByPublicId(publicId);
        entity.setInvitationCode(InviteCodeGenerator.generate());
        entity.setInvitationExpiry(LocalDate.now().plusDays(1));
        return mapper.toDto(repository.save(entity));
    }

    public JamiahDto findByPublicId(String publicId) {
        Jamiah entity = getByPublicId(publicId);
        return mapper.toDto(entity);
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
        if (entity.getMaxMembers() != null && entity.getMembers().size() >= entity.getMaxMembers()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member limit reached");
        }
        com.example.backend.UserProfile user = userRepository.findByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        entity.getMembers().add(user);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(String publicId) {
        Jamiah entity = getByPublicId(publicId);
        repository.delete(entity);
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

    private Jamiah getByPublicId(String publicId) {
        java.util.UUID uuid = java.util.UUID.fromString(publicId);
        return repository.findAll().stream()
                .filter(j -> java.util.UUID.nameUUIDFromBytes(j.getId().toString().getBytes()).equals(uuid))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
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
