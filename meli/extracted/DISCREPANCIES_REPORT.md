# Discrepancies Report — Phase 3: Deep Cross-Validation

**Generated**: 2026-02-26T00:00:00Z
**Mode**: FULL EXTRACTION

## Validation Summary

**Sources compared**: Code analysis only (FuryMCP unavailable)
**Discrepancy severity**: No critical discrepancies found within code analysis

## Field-Level Validation

### Entity: Sorter (DB vs JPA vs DTO)

| Field | DB (Flyway) | JPA Entity | SorterSummary | SorterDetail | TopologyPayload | TopologyResponse | Match? |
|-------|------------|-----------|--------------|-------------|----------------|-----------------|--------|
| id | VARCHAR(12) PK | String @Id | ✅ id | ✅ id | ❌ (not in request) | ✅ id | ✅ |
| sorter_id | VARCHAR(64) UNIQUE | String | ✅ sorter_id | ✅ sorter_id | ✅ sorter_id | ✅ sorter_id | ✅ |
| sorter_name | VARCHAR(128) | String | ✅ sorter_name | ✅ sorter_name | ✅ sorter_name | ✅ sorter_name | ✅ |
| constraints | JSON | String | ❌ (not in summary) | ✅ global_constraints | ✅ global_constraints | ✅ global_constraints | ✅* |
| nodes | JSON | String | ❌ (not in summary, only count) | ✅ nodes | ✅ nodes | ✅ nodes | ✅ |
| edges | JSON | String | ❌ (not in summary, only count) | ✅ edges | ✅ edges | ✅ edges | ✅ |
| created_at | DATETIME(6) | LocalDateTime | ✅ created_at | ✅ created_at | ❌ (not in request) | ✅ in _meta | ✅ |
| updated_at | DATETIME(6) | LocalDateTime | ✅ updated_at | ✅ updated_at | ❌ (not in request) | ✅ in _meta | ✅ |

*Note: DB column named `constraints`, but API uses `global_constraints` (intentional renaming for clarity)

### Endpoint Existence — Java Service

| Endpoint | Controller annotation | Service method | Test coverage | Consistent? |
|---------|----------------------|---------------|--------------|------------|
| GET /api/sorters | ✅ @GetMapping | ✅ listSorters() | ✅ | ✅ |
| GET /api/sorters/{sorterId} | ✅ @GetMapping("/{sorterId}") | ✅ getSorter() | ✅ | ✅ |
| POST /api/sorters | ✅ @PostMapping | ✅ createSorter() | ✅ | ✅ |
| PUT /api/sorters/{sorterId}/topology | ✅ @PutMapping("/{sorterId}/topology") | ✅ updateTopology() | ✅ | ✅ |
| DELETE /api/sorters/{sorterId} | ✅ @DeleteMapping("/{sorterId}") | ✅ deleteSorter() | ✅ | ✅ |
| GET /api/topology/{sorterId} | ✅ @GetMapping("/topology/{sorterId}") | ✅ getTopology() | ❌ (no dedicated controller test) | ⚠️ |
| GET /api/topology_exits/{sorterId} | ✅ @GetMapping("/topology_exits/{sorterId}") | ✅ getTopologyExits() | ❌ (no dedicated controller test) | ⚠️ |

### Endpoint Existence — Go Gateway

| Endpoint | Go Handler | Proxies to Java? | Consistent? |
|---------|-----------|-----------------|------------|
| GET /api/topology/:sorterId | GetTopology (direct) | ✅ /api/topology/{sorterId} | ✅ |
| GET /api/topology_exits/:sorterId | GetTopologyExits (direct) | ✅ /api/topology_exits/{sorterId} | ✅ |
| ALL /api/* | ProxyToJava | ✅ all Java endpoints | ✅ |

### README vs Code

| Claim | README | Code | Match? |
|-------|--------|------|--------|
| Go gateway port | 8080 | 8080 | ✅ |
| Java service port | 8081 | 8081 | ✅ |
| MySQL port | 3306 | 3306 | ✅ |
| Architecture description | Go → Java → MySQL | Code confirms | ✅ |

## Issues Found

### WARNING (Non-blocking)

1. **Missing controller tests for TopologyController**
   - `TopologyController` endpoints (`GET /api/topology/*`) have no `@WebMvcTest` coverage
   - Service methods `getTopology()` and `getTopologyExits()` ARE tested in `SorterServiceTest`
   - Risk: Controller layer behavior (HTTP mapping, response codes) untested
   - Recommendation: Add `TopologyControllerTest`

2. **DB column `constraints` vs API field `global_constraints`**
   - Intentional rename but undocumented
   - Handled in JPA by `@JsonProperty("global_constraints")` in DTOs
   - No confusion in practice, but worth documenting

3. **JSON column schemas not formalized**
   - `nodes`, `edges`, `constraints` stored as opaque JSON strings
   - No JSON Schema validation at persistence layer
   - Validation only at input time (TopologyValidator)

4. **`id` field generation**
   - `generateId()` uses `UUID.randomUUID().toString().replace("-","").substring(0,12)`
   - Truncated UUID: collision probability non-zero at large scale
   - Acceptable for current scale, worth noting for future

### INFO

5. **Go service AlwaysSampler**
   - `AlwaysSample` sampler set in OTel SDK
   - Comment in code says: "For production: set OTEL_TRACES_SAMPLER=parentbased_traceidratio"
   - Not a bug, just needs to be set via env var in Fury deployment

6. **CORS wildcard**
   - `allowedOrigins: "*"` in `WebConfig.java`
   - Acceptable for internal Fury service, but should be scoped to known origins in production

## No Critical Blockers

All critical data (endpoints, schemas, validation rules) is consistent between code layers.
System is ready for spec synthesis.
