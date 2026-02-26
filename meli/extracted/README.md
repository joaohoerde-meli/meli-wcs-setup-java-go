# Extracted Specs — Index

**Generated**: 2026-02-26
**Mode**: FULL EXTRACTION
**Strategy**: FULL (code analysis only — FuryMCP not available)

## Files

| File | Phase | Description |
|------|-------|-------------|
| `raw/README.md` | 0 | Extraction metadata and sources |
| `raw/existing-specs/DETECTION_REPORT.md` | 0 | Framework detection results |
| `raw/mcpfury/functional-docs.md` | 1 | FuryMCP data (unavailable) |
| `raw/code-analysis/architecture/overview.md` | 1 | System architecture diagram |
| `raw/code-analysis/api-specs/endpoints.md` | 1 | All REST endpoints with schemas |
| `raw/code-analysis/database/schema.md` | 1 | DB schema and migration history |
| `raw/code-analysis/deployment/infra.md` | 1 | Docker, Dockerfiles, env vars |
| `raw/code-analysis/fury-services/fury-status.md` | 1 | Fury migration status |
| `DOCUMENTATION_GAPS.md` | 2 | Coverage analysis and gaps |
| `DISCREPANCIES_REPORT.md` | 3 | Field-level validation results |
| `functional-spec.md` | 4 | Synthesized functional specification |
| `technical-spec.md` | 4 | Synthesized technical specification |
| `PATTERNS.md` | 5 | 10 discovered code patterns |

## Consistency Check (Phase 6)

### Use Case → Technical Implementation

| Use Case | Endpoint | Service Method | Status |
|----------|---------|---------------|--------|
| UC-001 List Sorters | GET /api/sorters | SorterService.listSorters() | ✅ |
| UC-002 View Detail | GET /api/sorters/{id} | SorterService.getSorter() | ✅ |
| UC-003 Create | POST /api/sorters | SorterService.createSorter() | ✅ |
| UC-004 Update | PUT /api/sorters/{id}/topology | SorterService.updateTopology() | ✅ |
| UC-005 Delete | DELETE /api/sorters/{id} | SorterService.deleteSorter() | ✅ |
| UC-006 View Topology | GET /api/topology/{id} | SorterService.getTopology() | ✅ |
| UC-007 View Exits | GET /api/topology_exits/{id} | SorterService.getTopologyExits() | ✅ |

### Business Rules → Implementation

| Rule | Implementation | Status |
|------|--------------|--------|
| BR-001 sorter_id unique | DB UNIQUE + 409 response | ✅ |
| BR-002 at least one node | TopologyValidator Rule 1 | ✅ |
| BR-003 no duplicate node IDs | TopologyValidator Rule 4 | ✅ |
| BR-004 max_tu_weight_kg constraint | TopologyValidator Rule 2 | ✅ |
| BR-005 max_tu_dimensions_cm constraint | TopologyValidator Rule 3 | ✅ |
| BR-006 edge distance >= 0 | TopologyValidator Rule 5 | ✅ |
| BR-007 edge throughput > 0 | TopologyValidator Rule 6 | ✅ |
| BR-008 id immutable | PUT only updates name/constraints/nodes/edges | ✅ |
| BR-009 nodes max 500 | @Size(max=500) | ✅ |
| BR-010 edges max 2000 | @Size(max=2000) | ✅ |
| BR-011 exit node algorithm | SorterService.getTopologyExits() leaf calc | ✅ |

### Data Models — Functional ↔ Technical

| Model (functional) | Schema (technical) | Consistent? |
|--------------------|-------------------|------------|
| Sorter | sorters table + Sorter entity | ✅ |
| global_constraints | JSON in constraints col | ✅ |
| Node | nodes JSON array items | ✅ |
| Edge | edges JSON array items | ✅ |

**Phase 6 result**: ✅ No CRITICAL inconsistencies. All use cases have technical implementations. All business rules are coded.

## Warnings (Non-blocking)

- TopologyController lacks @WebMvcTest coverage (see DISCREPANCIES_REPORT.md)
- CORS wildcard should be scoped in production
- AlwaysSampler should be parameterized in Fury deployment
