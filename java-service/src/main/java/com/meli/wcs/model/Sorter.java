package com.meli.wcs.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sorters")
public class Sorter {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "sorter_id", unique = true, nullable = false)
    private String sorterId;

    @Column(name = "sorter_name", nullable = false)
    private String sorterName;

    @Column(columnDefinition = "JSON")
    private String constraints;

    @Column(columnDefinition = "JSON")
    private String nodes;

    @Column(columnDefinition = "JSON")
    private String edges;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
