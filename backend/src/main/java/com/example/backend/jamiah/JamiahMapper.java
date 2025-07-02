package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface JamiahMapper {
    @Mapping(target = "currentMembers", expression = "java(jamiah.getMembers() == null ? 0 : jamiah.getMembers().size())")
    JamiahDto toDto(Jamiah jamiah);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "members", ignore = true)
    Jamiah toEntity(JamiahDto dto);

    /**
     * Map the numeric database id to a UUID used in the API.
     * This deterministic mapping avoids exposing the raw Long id.
     */
    default java.util.UUID map(Long value) {
        return value == null ? null
                : java.util.UUID.nameUUIDFromBytes(value.toString().getBytes());
    }
}
