package com.meli.wcs.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.meli.wcs.dto.TopologyPayload;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class TopologyValidatorTest {

    private final TopologyValidator validator = new TopologyValidator();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void emptyNodes_throwsWithMessage() {
        TopologyPayload payload = new TopologyPayload("S-01", "Test", null, List.of(), List.of());
        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .contains("Graph must contain at least one node."));
    }

    @Test
    void duplicateNodeId_throwsWithMessage() throws Exception {
        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");
        List<com.fasterxml.jackson.databind.JsonNode> nodes = List.of(node, node);

        TopologyPayload payload = new TopologyPayload("S-01", "Test",
                buildValidConstraints(), nodes, List.of());

        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .anyMatch(e -> e.contains("Duplicate node ID: POS-001")));
    }

    @Test
    void maxWeightOutOfRange_throwsWithMessage() {
        ObjectNode gc = mapper.createObjectNode();
        gc.put("max_tu_weight_kg", 0);
        ObjectNode dims = mapper.createObjectNode();
        dims.put("length", 100); dims.put("width", 80); dims.put("height", 60);
        gc.set("max_tu_dimensions_cm", dims);

        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");

        TopologyPayload payload = new TopologyPayload("S-01", "Test", gc, List.of(node), List.of());

        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .anyMatch(e -> e.contains("Max TU weight")));
    }

    @Test
    void negativeDimension_throwsWithMessage() {
        ObjectNode gc = mapper.createObjectNode();
        gc.put("max_tu_weight_kg", 25);
        ObjectNode dims = mapper.createObjectNode();
        dims.put("length", -1); dims.put("width", 80); dims.put("height", 60);
        gc.set("max_tu_dimensions_cm", dims);

        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");

        TopologyPayload payload = new TopologyPayload("S-01", "Test", gc, List.of(node), List.of());

        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .anyMatch(e -> e.contains("dimensions must be positive")));
    }

    @Test
    void negativeEdgeDistance_throwsWithMessage() {
        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");

        ObjectNode edge = mapper.createObjectNode();
        edge.put("id", "E-001");
        edge.put("distance_m", -5.0);
        edge.put("max_throughput_tu_per_min", 60);

        TopologyPayload payload = new TopologyPayload("S-01", "Test",
                buildValidConstraints(), List.of(node), List.of(edge));

        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .anyMatch(e -> e.contains("distance must be >= 0")));
    }

    @Test
    void zeroThroughput_throwsWithMessage() {
        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");

        ObjectNode edge = mapper.createObjectNode();
        edge.put("id", "E-001");
        edge.put("distance_m", 10.0);
        edge.put("max_throughput_tu_per_min", 0);

        TopologyPayload payload = new TopologyPayload("S-01", "Test",
                buildValidConstraints(), List.of(node), List.of(edge));

        assertThatThrownBy(() -> validator.validate(payload))
                .isInstanceOf(TopologyValidationException.class)
                .satisfies(ex -> assertThat(((TopologyValidationException) ex).getErrors())
                        .anyMatch(e -> e.contains("throughput must be > 0")));
    }

    @Test
    void validPayload_doesNotThrow() {
        ObjectNode node = mapper.createObjectNode();
        node.put("id", "POS-001");

        ObjectNode edge = mapper.createObjectNode();
        edge.put("id", "E-001");
        edge.put("distance_m", 10.0);
        edge.put("max_throughput_tu_per_min", 60);

        TopologyPayload payload = new TopologyPayload("S-01", "Test Sorter",
                buildValidConstraints(), List.of(node), List.of(edge));

        assertThatCode(() -> validator.validate(payload)).doesNotThrowAnyException();
    }

    private ObjectNode buildValidConstraints() {
        ObjectNode gc = mapper.createObjectNode();
        gc.put("max_tu_weight_kg", 25);
        ObjectNode dims = mapper.createObjectNode();
        dims.put("length", 100); dims.put("width", 80); dims.put("height", 60);
        gc.set("max_tu_dimensions_cm", dims);
        return gc;
    }
}
