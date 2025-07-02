package com.example.backend;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String uid;

    @Column(nullable = false, unique = true)
    private String username;

    private String firstName;
    private String lastName;
    private String birthDate;
    private String gender;
    private String nationality;
    private String address;
    private String phone;
    private String language;
    @Column(length = 2048)
    private String interests;

    @ManyToMany(mappedBy = "members")
    private Set<com.example.backend.jamiah.Jamiah> jamiahs = new HashSet<>();

    public UserProfile() {
    }

    public Long getId() {
        return id;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }

    public Set<com.example.backend.jamiah.Jamiah> getJamiahs() {
        return jamiahs;
    }

    public void setJamiahs(Set<com.example.backend.jamiah.Jamiah> jamiahs) {
        this.jamiahs = jamiahs;
    }
}
