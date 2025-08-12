package com.example.backend.jamiah.dto;

import java.time.LocalDate;

public class CycleSummaryDto {
    private Long id;
    private Integer cycleNumber;
    private LocalDate startDate;
    private boolean completed;
    private String recipientUid;
    private int totalPayers;
    private int paidCount;
    private int receiptCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getCycleNumber() { return cycleNumber; }
    public void setCycleNumber(Integer cycleNumber) { this.cycleNumber = cycleNumber; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public String getRecipientUid() { return recipientUid; }
    public void setRecipientUid(String recipientUid) { this.recipientUid = recipientUid; }

    public int getTotalPayers() { return totalPayers; }
    public void setTotalPayers(int totalPayers) { this.totalPayers = totalPayers; }

    public int getPaidCount() { return paidCount; }
    public void setPaidCount(int paidCount) { this.paidCount = paidCount; }

    public int getReceiptCount() { return receiptCount; }
    public void setReceiptCount(int receiptCount) { this.receiptCount = receiptCount; }
}
