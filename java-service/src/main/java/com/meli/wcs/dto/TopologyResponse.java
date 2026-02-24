package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record TopologyResponse(
        String id,

        @JsonProperty("sorter_id")
        String sorterId,

        @JsonProperty("sorter_name")
        String sorterName,

        @JsonProperty("global_constraints")
        JsonNode globalConstraints,

        List<JsonNode> nodes,

        List<JsonNode> edges,

        @JsonProperty("_meta")
        Map<String, Object> meta
) {}
