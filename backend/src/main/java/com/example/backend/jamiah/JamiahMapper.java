package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface JamiahMapper {
    JamiahDto toDto(Jamiah jamiah);

    @Mapping(target = "id", ignore = true)
    Jamiah toEntity(JamiahDto dto);
}
