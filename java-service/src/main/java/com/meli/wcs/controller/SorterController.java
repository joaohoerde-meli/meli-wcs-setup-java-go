package com.meli.wcs.controller;

import com.meli.wcs.dto.SorterDetail;
import com.meli.wcs.dto.SorterSummary;
import com.meli.wcs.dto.TopologyPayload;
import com.meli.wcs.service.SorterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sorters")
@RequiredArgsConstructor
public class SorterController {

    private final SorterService service;

    @GetMapping
    public List<SorterSummary> listSorters() {
        return service.listSorters();
    }

    @GetMapping("/{sorterId}")
    public SorterDetail getSorter(@PathVariable String sorterId) {
        return service.getSorter(sorterId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SorterDetail createSorter(@Valid @RequestBody TopologyPayload payload) {
        return service.createSorter(payload);
    }

    @PutMapping("/{sorterId}/topology")
    public SorterDetail updateTopology(@PathVariable String sorterId,
                                       @Valid @RequestBody TopologyPayload payload) {
        return service.updateTopology(sorterId, payload);
    }

    @DeleteMapping("/{sorterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSorter(@PathVariable String sorterId) {
        service.deleteSorter(sorterId);
    }
}
