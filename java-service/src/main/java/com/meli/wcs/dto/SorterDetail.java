package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.List;

public record SorterDetail(
        String id,

        @JsonProperty("sorter_id")
        String sorterId,

        @JsonProperty("sorter_name")
        String sorterName,

        @JsonProperty("global_constraints")
        JsonNode globalConstraints,

        List<JsonNode> nodes,

        List<JsonNode> edges,

        @JsonProperty("node_count")
        int nodeCount,

        @JsonProperty("edge_count")
        int edgeCount,

        @JsonProperty("created_at")
        LocalDateTime createdAt,

        @JsonProperty("updated_at")
        LocalDateTime updatedAt
) {}
