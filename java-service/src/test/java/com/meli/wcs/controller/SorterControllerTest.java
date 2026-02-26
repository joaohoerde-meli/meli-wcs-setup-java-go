package com.meli.wcs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meli.wcs.dto.SorterDetail;
import com.meli.wcs.dto.SorterSummary;
import com.meli.wcs.dto.TopologyPayload;
import com.meli.wcs.service.SorterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SorterController.class)
class SorterControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    SorterService service;

    // ── GET /api/sorters ──────────────────────────────────────────────────────

    @Test
    void listSorters_returns200WithEmptyArray() throws Exception {
        when(service.listSorters()).thenReturn(List.of());
        mockMvc.perform(get("/api/sorters"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void listSorters_withItems_returns200() throws Exception {
        SorterSummary summary = new SorterSummary("abc", "S-01", "Test", 2, 1,
                LocalDateTime.now(), LocalDateTime.now());
        when(service.listSorters()).thenReturn(List.of(summary));
        mockMvc.perform(get("/api/sorters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sorter_id").value("S-01"));
    }

    // ── POST /api/sorters ─────────────────────────────────────────────────────

    @Test
    void createSorter_validPayload_returns201() throws Exception {
        SorterDetail detail = buildDetail("S-01", "Test Sorter");
        when(service.createSorter(any())).thenReturn(detail);

        String body = """
                {
                  "sorter_id": "S-01",
                  "sorter_name": "Test Sorter",
                  "global_constraints": {},
                  "nodes": [],
                  "edges": []
                }
                """;

        mockMvc.perform(post("/api/sorters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sorter_id").value("S-01"));
    }

    @Test
    void createSorter_missingSorterId_returns400() throws Exception {
        String body = """
                {
                  "sorter_name": "Test",
                  "nodes": [],
                  "edges": []
                }
                """;

        mockMvc.perform(post("/api/sorters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSorter_missingNodes_returns400() throws Exception {
        String body = """
                {
                  "sorter_id": "S-01",
                  "sorter_name": "Test"
                }
                """;

        mockMvc.perform(post("/api/sorters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /api/sorters/{sorterId}/topology ──────────────────────────────────

    @Test
    void updateTopology_exists_returns200() throws Exception {
        SorterDetail detail = buildDetail("S-01", "Updated");
        when(service.updateTopology(eq("S-01"), any())).thenReturn(detail);

        String body = """
                {
                  "sorter_id": "S-01",
                  "sorter_name": "Updated",
                  "global_constraints": {},
                  "nodes": [],
                  "edges": []
                }
                """;

        mockMvc.perform(put("/api/sorters/S-01/topology")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sorter_name").value("Updated"));
    }

    // ── DELETE /api/sorters/{sorterId} ────────────────────────────────────────

    @Test
    void deleteSorter_exists_returns204() throws Exception {
        doNothing().when(service).deleteSorter("S-01");
        mockMvc.perform(delete("/api/sorters/S-01"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteSorter_notFound_returns404() throws Exception {
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Sorter 'GHOST' not found"))
                .when(service).deleteSorter("GHOST");
        mockMvc.perform(delete("/api/sorters/GHOST"))
                .andExpect(status().isNotFound());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private SorterDetail buildDetail(String sorterId, String sorterName) {
        return new SorterDetail("abc123def456", sorterId, sorterName,
                new ObjectMapper().createObjectNode(),
                List.of(), List.of(), 0, 0,
                LocalDateTime.now(), LocalDateTime.now());
    }
}
