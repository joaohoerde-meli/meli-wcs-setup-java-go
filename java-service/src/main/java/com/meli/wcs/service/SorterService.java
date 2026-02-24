package com.meli.wcs.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meli.wcs.dto.*;
import com.meli.wcs.model.Sorter;
import com.meli.wcs.repository.SorterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SorterService {

    private final SorterRepository repository;
    private final ObjectMapper objectMapper;

    // ── List ──────────────────────────────────────────────────────────────────

    public List<SorterSummary> listSorters() {
        return repository.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    // ── Get detail ────────────────────────────────────────────────────────────

    public SorterDetail getSorter(String sorterId) {
        Sorter s = findBySorterId(sorterId);
        return toDetail(s);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public SorterDetail createSorter(TopologyPayload payload) {
        if (repository.existsBySorterId(payload.sorterId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sorter with id '" + payload.sorterId() + "' already exists");
        }

        Sorter sorter = Sorter.builder()
                .id(generateId())
                .sorterId(payload.sorterId())
                .sorterName(payload.sorterName())
                .constraints(toJson(payload.globalConstraints()))
                .nodes(toJson(payload.nodes()))
                .edges(toJson(payload.edges()))
                .build();

        return toDetail(repository.save(sorter));
    }

    // ── Update topology ───────────────────────────────────────────────────────

    @Transactional
    public SorterDetail updateTopology(String sorterId, TopologyPayload payload) {
        Sorter sorter = findBySorterId(sorterId);

        sorter.setSorterName(payload.sorterName());
        sorter.setConstraints(toJson(payload.globalConstraints()));
        sorter.setNodes(toJson(payload.nodes()));
        sorter.setEdges(toJson(payload.edges()));

        return toDetail(repository.save(sorter));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteSorter(String sorterId) {
        Sorter sorter = findBySorterId(sorterId);
        repository.delete(sorter);
    }

    // ── Topology read (hot path) ──────────────────────────────────────────────

    public TopologyResponse getTopology(String sorterId) {
        Sorter s = findBySorterId(sorterId);

        List<JsonNode> nodes = parseJsonList(s.getNodes());
        List<JsonNode> edges = parseJsonList(s.getEdges());

        Map<String, Object> meta = Map.of(
                "node_count", nodes.size(),
                "edge_count", edges.size(),
                "created_at", s.getCreatedAt().toString(),
                "updated_at", s.getUpdatedAt().toString()
        );

        return new TopologyResponse(
                s.getId(),
                s.getSorterId(),
                s.getSorterName(),
                parseJson(s.getConstraints()),
                nodes,
                edges,
                meta
        );
    }

    // ── Topology exits (leaf nodes) ───────────────────────────────────────────

    public TopologyExitsResponse getTopologyExits(String sorterId) {
        Sorter s = findBySorterId(sorterId);

        List<JsonNode> nodes = parseJsonList(s.getNodes());
        List<JsonNode> edges = parseJsonList(s.getEdges());

        // Build set of node IDs that have at least one outgoing edge
        Set<String> hasOutgoing = new HashSet<>();
        for (JsonNode edge : edges) {
            JsonNode from = edge.get("from");
            if (from != null) {
                hasOutgoing.add(from.asText());
            }
        }

        // Exit nodes = nodes with no outgoing edges
        List<Map<String, Object>> exits = new ArrayList<>();
        for (JsonNode node : nodes) {
            String nodeId = node.has("id") ? node.get("id").asText() : null;
            if (nodeId != null && !hasOutgoing.contains(nodeId)) {
                Map<String, Object> exit = new LinkedHashMap<>();
                exit.put("id", nodeId);
                if (node.has("name")) exit.put("name", node.get("name").asText());
                if (node.has("capacity")) exit.put("capacity", node.get("capacity").asInt());
                exits.add(exit);
            }
        }

        Map<String, Object> meta = Map.of(
                "total_nodes", nodes.size(),
                "exit_count", exits.size()
        );

        return new TopologyExitsResponse(s.getSorterId(), s.getSorterName(), exits, meta);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Sorter findBySorterId(String sorterId) {
        return repository.findBySorterId(sorterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Sorter '" + sorterId + "' not found"));
    }

    private SorterSummary toSummary(Sorter s) {
        return new SorterSummary(
                s.getId(),
                s.getSorterId(),
                s.getSorterName(),
                parseJsonList(s.getNodes()).size(),
                parseJsonList(s.getEdges()).size(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    private SorterDetail toDetail(Sorter s) {
        List<JsonNode> nodes = parseJsonList(s.getNodes());
        List<JsonNode> edges = parseJsonList(s.getEdges());
        return new SorterDetail(
                s.getId(),
                s.getSorterId(),
                s.getSorterName(),
                parseJson(s.getConstraints()),
                nodes,
                edges,
                nodes.size(),
                edges.size(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String toJson(Object value) {
        if (value == null) return "{}";
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }

    private JsonNode parseJson(String json) {
        if (json == null || json.isBlank()) return objectMapper.createObjectNode();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private List<JsonNode> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<JsonNode>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
