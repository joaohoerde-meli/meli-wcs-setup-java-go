package com.meli.wcs.controller;

import com.meli.wcs.dto.TopologyExitsResponse;
import com.meli.wcs.dto.TopologyResponse;
import com.meli.wcs.service.SorterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TopologyController {

    private final SorterService service;

    @GetMapping("/topology/{sorterId}")
    public TopologyResponse getTopology(@PathVariable String sorterId) {
        return service.getTopology(sorterId);
    }

    @GetMapping("/topology_exits/{sorterId}")
    public TopologyExitsResponse getTopologyExits(@PathVariable String sorterId) {
        return service.getTopologyExits(sorterId);
    }
}
