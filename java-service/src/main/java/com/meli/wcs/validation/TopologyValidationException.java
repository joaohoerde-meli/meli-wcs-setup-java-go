package com.meli.wcs.validation;

import java.util.List;

public class TopologyValidationException extends RuntimeException {

    private final List<String> errors;

    public TopologyValidationException(List<String> errors) {
        super("Topology validation failed: " + errors);
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
