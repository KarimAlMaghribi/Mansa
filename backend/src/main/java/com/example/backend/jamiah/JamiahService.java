package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
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

    public JamiahService(JamiahRepository repository, JamiahMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
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
        entity.setMonthlyContribution(dto.getMonthlyContribution());
        entity.setIsPublic(dto.getIsPublic());
        entity.setMaxGroupSize(dto.getMaxGroupSize());
        entity.setCycleCount(dto.getCycleCount());
        entity.setRateAmount(dto.getRateAmount());
        entity.setRateInterval(dto.getRateInterval());
        entity.setStartDate(dto.getStartDate());
        return mapper.toDto(repository.save(entity));
    }

    void validateParameters(JamiahDto dto) {
        if (dto.getMaxGroupSize() != null && dto.getMaxGroupSize() < 2) {
            throw new IllegalArgumentException("maxGroupSize must be >= 2");
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
