package com.example.backend.jamiah;

import com.example.backend.jamiah.dto.JamiahDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface JamiahMapper {
    @Mapping(target = "currentMembers",
            expression = "java(jamiah.getMembers() == null ? 0 : jamiah.getMembers().size())")
    @Mapping(target = "id", source = "publicId")
    JamiahDto toDto(Jamiah jamiah);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "publicId", source = "id")
    @Mapping(target = "members", ignore = true)
    Jamiah toEntity(JamiahDto dto);
}
