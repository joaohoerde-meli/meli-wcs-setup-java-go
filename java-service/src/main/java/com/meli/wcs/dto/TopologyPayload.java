package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record TopologyPayload(
        @JsonProperty("sorter_id")
        @NotBlank(message = "sorter_id is required")
        String sorterId,

        @JsonProperty("sorter_name")
        @NotBlank(message = "sorter_name is required")
        String sorterName,

        @JsonProperty("global_constraints")
        JsonNode globalConstraints,

        @NotNull(message = "nodes is required")
        List<JsonNode> nodes,

        @NotNull(message = "edges is required")
        List<JsonNode> edges
) {}
