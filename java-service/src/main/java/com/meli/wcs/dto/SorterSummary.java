package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record SorterSummary(
        String id,

        @JsonProperty("sorter_id")
        String sorterId,

        @JsonProperty("sorter_name")
        String sorterName,

        @JsonProperty("node_count")
        int nodeCount,

        @JsonProperty("edge_count")
        int edgeCount,

        @JsonProperty("created_at")
        LocalDateTime createdAt,

        @JsonProperty("updated_at")
        LocalDateTime updatedAt
) {}
