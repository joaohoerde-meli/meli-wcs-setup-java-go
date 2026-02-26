package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TopologyPayload(
        @JsonProperty("sorter_id")
        @NotBlank(message = "sorter_id is required")
        @Size(max = 64, message = "sorter_id must be at most 64 characters")
        String sorterId,

        @JsonProperty("sorter_name")
        @NotBlank(message = "sorter_name is required")
        @Size(max = 128, message = "sorter_name must be at most 128 characters")
        String sorterName,

        @JsonProperty("global_constraints")
        JsonNode globalConstraints,

        @NotNull(message = "nodes is required")
        @Size(max = 500, message = "nodes list must not exceed 500 items")
        List<JsonNode> nodes,

        @NotNull(message = "edges is required")
        @Size(max = 2000, message = "edges list must not exceed 2000 items")
        List<JsonNode> edges
) {}
