# Documentation Gaps — Phase 2: Cross-Validation

**Generated**: 2026-02-26T00:00:00Z
**Mode**: FULL EXTRACTION

## Coverage Summary

| Source | Coverage | Status |
|--------|----------|--------|
| Code analysis | 100% | ✅ Complete |
| Existing specs | 0% | ❌ None found |
| FuryMCP | 0% | ⚠️ App not in Fury yet |
| MeliSystemMCP | 0% | ⚠️ App not in Fury yet |

**Overall confidence**: 🔸 CODE_ONLY (all data from code analysis only)

## Actor Discovery Limitations

- **MeliSystemMCP**: Unavailable — app not yet registered in Fury Systems model
- **FuryMCP**: Unavailable — no `.fury` file, app not registered
- **Code analysis**: Limited — no API gateway configs, no access log patterns
- **Recommendation**: After `fury app create`, re-run `/meli.reverse-eng` (UPDATE mode) to discover authoritative clients/dependencies

## Missing Data — By Category

### Actors / Clients
- **Gap**: Unknown which services/frontends call the Go gateway at :8080
- **Known from code**: The frontend (`meli-wcs` — Next.js + ReactFlow) is the primary consumer based on CORS wildcard config
- **Unknown**: Any other internal consumers, CI systems, load testing tools

### Fury Platform Services
- **Gap**: No KVS, BigQueue, or Fury-managed services in use — none to document

### API Documentation
- **Gap**: No OpenAPI/Swagger spec generated yet
- **Known**: All endpoints documented via code analysis (7 endpoints total)
- **Recommendation**: Add `springdoc-openapi-starter-webmvc-ui` to pom.xml for auto-generated Swagger UI

### Node/Edge JSON Schema
- **Gap**: No formal JSON Schema defined for `nodes` and `edges` JSON columns
- **Known from code**: Basic field usage (id, name, type, capacity, from, to, distance_m, max_throughput_tu_per_min)
- **Unknown**: Full set of valid fields, required vs optional fields per node type

### Deployment / Fury
- **Gap**: Fury app manifest (`.fury` file) does not exist
- **Gap**: No `fury.yaml` or explicit Fury resource definitions
- **Status**: Pre-migration, Docker Compose only

## Gaps by Priority

| Priority | Gap | Impact |
|----------|-----|--------|
| HIGH | No `.fury` file / Fury app registration | Blocks Fury deployment |
| HIGH | No formal JSON Schema for nodes/edges | Ambiguous data contract |
| MEDIUM | No OpenAPI spec generated | Missing machine-readable API contract |
| MEDIUM | Actor/client discovery (who calls this system) | Incomplete system context |
| LOW | No formal ADR documents | Architectural decisions undocumented |
| LOW | go.sum not checked in | Reproducible builds risk |

## What IS Well-Documented (from code)

- ✅ All 7 REST endpoints with full request/response schemas
- ✅ Database schema (Flyway + JPA entity)
- ✅ All 8 validation rules (2 layers)
- ✅ Error response format (RFC 9457 ProblemDetail)
- ✅ All environment variables
- ✅ OTel observability configuration
- ✅ Architecture (Go gateway → Java → MySQL)
- ✅ 22 unit/integration tests coverage
- ✅ Exit node calculation algorithm
