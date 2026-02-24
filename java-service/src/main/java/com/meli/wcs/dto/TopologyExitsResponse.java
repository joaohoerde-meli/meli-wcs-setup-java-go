package com.meli.wcs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record TopologyExitsResponse(
        @JsonProperty("sorter_id")
        String sorterId,

        @JsonProperty("sorter_name")
        String sorterName,

        List<Map<String, Object>> exits,

        @JsonProperty("_meta")
        Map<String, Object> meta
) {}
