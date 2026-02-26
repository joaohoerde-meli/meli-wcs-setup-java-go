package com.meli.wcs.controller;

import com.meli.wcs.dto.TopologyExitsResponse;
import com.meli.wcs.dto.TopologyResponse;
import com.meli.wcs.service.SorterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TopologyController.class)
class TopologyControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    SorterService service;

    // ── GET /api/topology/{sorterId} ──────────────────────────────────────────

    @Test
    void getTopology_found_returns200() throws Exception {
        Map<String, Object> meta = Map.of(
                "node_count", 2, "edge_count", 1,
                "created_at", "2024-01-01T00:00:00",
                "updated_at", "2024-01-01T00:00:00");
        TopologyResponse response = new TopologyResponse(
                "abc123def456", "SORTER-001", "Main Sorter",
                new ObjectMapper().createObjectNode(),
                List.of(), List.of(), meta);

        when(service.getTopology("SORTER-001")).thenReturn(response);

        mockMvc.perform(get("/api/topology/SORTER-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sorter_id").value("SORTER-001"))
                .andExpect(jsonPath("$.sorter_name").value("Main Sorter"))
                .andExpect(jsonPath("$._meta.node_count").value(2))
                .andExpect(jsonPath("$._meta.edge_count").value(1));
    }

    @Test
    void getTopology_notFound_returns404() throws Exception {
        when(service.getTopology("GHOST"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Sorter 'GHOST' not found"));

        mockMvc.perform(get("/api/topology/GHOST"))
                .andExpect(status().isNotFound());
    }

    // ── GET /api/topology_exits/{sorterId} ────────────────────────────────────

    @Test
    void getTopologyExits_found_returns200() throws Exception {
        List<Map<String, Object>> exits = List.of(
                Map.of("id", "POS-005", "name", "Exit A", "capacity", 20));
        Map<String, Object> meta = Map.of("total_nodes", 5, "exit_count", 1);
        TopologyExitsResponse response = new TopologyExitsResponse(
                "SORTER-001", "Main Sorter", exits, meta);

        when(service.getTopologyExits("SORTER-001")).thenReturn(response);

        mockMvc.perform(get("/api/topology_exits/SORTER-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sorter_id").value("SORTER-001"))
                .andExpect(jsonPath("$.exits[0].id").value("POS-005"))
                .andExpect(jsonPath("$._meta.exit_count").value(1))
                .andExpect(jsonPath("$._meta.total_nodes").value(5));
    }

    @Test
    void getTopologyExits_notFound_returns404() throws Exception {
        when(service.getTopologyExits("GHOST"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Sorter 'GHOST' not found"));

        mockMvc.perform(get("/api/topology_exits/GHOST"))
                .andExpect(status().isNotFound());
    }
}
