package com.example.backend.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class JamiahWalletId implements Serializable {

    @Column(name = "jamiah_id")
    private Long jamiahId;

    @Column(name = "member_id")
    private Long memberId;

    public JamiahWalletId() {
    }

    public JamiahWalletId(Long jamiahId, Long memberId) {
        this.jamiahId = jamiahId;
        this.memberId = memberId;
    }

    public Long getJamiahId() {
        return jamiahId;
    }

    public void setJamiahId(Long jamiahId) {
        this.jamiahId = jamiahId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JamiahWalletId that = (JamiahWalletId) o;
        return Objects.equals(jamiahId, that.jamiahId) && Objects.equals(memberId, that.memberId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(jamiahId, memberId);
    }
}
