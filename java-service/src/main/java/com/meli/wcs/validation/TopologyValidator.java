package com.meli.wcs.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.meli.wcs.dto.TopologyPayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Mirrors the semantic validation rules defined in the frontend's validateTopology()
 * (wcs-store.ts), enforcing the same constraints server-side.
 */
@Slf4j
@Component
public class TopologyValidator {

    public void validate(TopologyPayload payload) {
        List<String> errors = new ArrayList<>();

        List<JsonNode> nodes = payload.nodes();
        List<JsonNode> edges = payload.edges();
        JsonNode gc = payload.globalConstraints();

        // Rule 1: at least one node
        if (nodes.isEmpty()) {
            errors.add("Graph must contain at least one node.");
        } else {
            // Rule 4: no duplicate node IDs
            Set<String> seen = new HashSet<>();
            for (JsonNode node : nodes) {
                String nodeId = node.path("id").asText(null);
                if (nodeId != null && !seen.add(nodeId)) {
                    errors.add("Duplicate node ID: " + nodeId);
                }
            }
        }

        // Rules 2 & 3: global_constraints
        if (gc != null && !gc.isNull() && !gc.isMissingNode()) {
            double maxWeight = gc.path("max_tu_weight_kg").asDouble(0);
            if (maxWeight <= 0 || maxWeight > 200) {
                errors.add("Max TU weight must be between 0 and 200 kg.");
            }

            JsonNode dims = gc.path("max_tu_dimensions_cm");
            if (!dims.isMissingNode() && !dims.isNull()) {
                double length = dims.path("length").asDouble(0);
                double width  = dims.path("width").asDouble(0);
                double height = dims.path("height").asDouble(0);
                if (length <= 0 || width <= 0 || height <= 0) {
                    errors.add("All TU dimensions must be positive.");
                }
            }
        }

        // Rules 5 & 6: edge constraints
        for (JsonNode edge : edges) {
            String edgeId = edge.path("id").asText("?");

            JsonNode distNode = edge.path("distance_m");
            if (!distNode.isMissingNode() && distNode.asDouble(0) < 0) {
                errors.add("Edge " + edgeId + ": distance must be >= 0.");
            }

            double throughput = edge.path("max_throughput_tu_per_min").asDouble(0);
            if (throughput <= 0) {
                errors.add("Edge " + edgeId + ": throughput must be > 0.");
            }
        }

        if (!errors.isEmpty()) {
            log.warn("Topology validation failed [sorter_id={}, error_count={}, errors={}]",
                    payload.sorterId(), errors.size(), errors);
            throw new TopologyValidationException(errors);
        }
    }
}
