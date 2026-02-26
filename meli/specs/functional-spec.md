# Functional Specification — WCS Topology Setup

**Project**: meli-wcs-setup-java-go
**Version**: 1.0.0
**Generated**: 2026-02-26
**Source**: Code analysis only (🔸 CODE_ONLY — FuryMCP not yet available)
**Extraction mode**: FULL

---

## 1. System Overview

The **WCS Topology Setup** service provides warehouse control system (WCS) operators with the ability to configure and manage the physical topology of sorting systems. It allows registering sorters with their graph-based layout (nodes and edges), defining global throughput constraints, and querying topology views for downstream systems.

### System Context

```
┌──────────────────────────────────────────────────────────────┐
│                     External Actors                          │
│                                                              │
│  [WCS Frontend]          [Internal Services / CLI]           │
│  Next.js + ReactFlow     (planned — not yet confirmed)       │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTP
                   ▼
        ┌─────────────────────┐
        │  WCS Go Gateway     │  :8080
        │  (wcs-go-service)   │
        └──────────┬──────────┘
                   │ HTTP (proxy)
                   ▼
        ┌─────────────────────┐
        │  WCS Java Service   │  :8081
        │ (wcs-java-service)  │
        └──────────┬──────────┘
                   │ JDBC
                   ▼
        ┌─────────────────────┐
        │  MySQL 8 (wcs_db)   │  :3306
        └─────────────────────┘
```

### Inbound Clients (who calls this system)

| Client | Type | Interaction | Evidence | Confidence |
|--------|------|-------------|----------|-----------|
| WCS Frontend (meli-wcs) | Internal web app (Next.js + ReactFlow) | Full CRUD via Go gateway :8080 | CORS wildcard config + project context | 🔸 CODE_ONLY |
| Unknown internal services | ❓ | GET /api/topology/* | Inferred from gateway design | ❓ UNKNOWN |

### Outbound Dependencies (what this system calls)

| Dependency | Type | Purpose | Evidence | Confidence |
|------------|------|---------|----------|-----------|
| MySQL 8 (wcs_db) | Datastore | Persist sorter topology data | JDBC config + JPA entity | 🔸 CODE_ONLY |

### Platform Services Owned

| Service | Type | Status |
|---------|------|--------|
| MySQL database | Relational DB | Local (Docker), Fury MySQL pending |
| OTel Collector | Observability | Local (Docker), Fury platform telemetry pending |

---

## 2. Actors

| Actor | Type | Interaction | Evidence | Confidence |
|-------|------|-------------|----------|-----------|
| WCS Operator | Human (via frontend) | Creates, updates, deletes sorter topologies | CORS config, project context | 🔸 CODE_ONLY |
| WCS Frontend | Internal system | Calls all CRUD endpoints + topology views | CORS wildcard, project context | 🔸 CODE_ONLY |
| Downstream routing system | Internal system (inferred) | Reads topology and exit nodes for routing decisions | Design of GET /api/topology/* endpoints | ❓ UNKNOWN |

---

## 3. Use Cases

### UC-001: List All Sorters
🔸 CODE_ONLY

**Actor**: WCS Operator / WCS Frontend
**Goal**: See a summary of all registered sorters

**Flow**:
1. Actor sends `GET /api/sorters`
2. System returns a list of sorter summaries
3. Each summary includes: id, sorter_id, sorter_name, node_count, edge_count, created_at, updated_at

**Result**: List of summaries (may be empty)
**Error cases**: None (always returns 200, even if empty)

---

### UC-002: View Sorter Detail
🔸 CODE_ONLY

**Actor**: WCS Operator / WCS Frontend
**Goal**: See full configuration of a specific sorter including topology data

**Flow**:
1. Actor sends `GET /api/sorters/{sorterId}` using the business `sorter_id`
2. System looks up sorter by `sorter_id`
3. System returns full detail including global_constraints, nodes array, edges array

**Result**: Full sorter detail
**Error cases**:
- `404 Not Found` — sorter_id not registered

---

### UC-003: Register New Sorter Topology
🔸 CODE_ONLY

**Actor**: WCS Operator / WCS Frontend
**Goal**: Register a new sorter with its full topology graph

**Preconditions**: `sorter_id` not already registered

**Flow**:
1. Actor sends `POST /api/sorters` with sorter_id, sorter_name, global_constraints, nodes, edges
2. System validates structural constraints (Bean Validation):
   - sorter_id: required, max 64 chars
   - sorter_name: required, max 128 chars
   - nodes: required, max 500 items
   - edges: required, max 2000 items
3. System validates semantic topology rules (TopologyValidator):
   - At least one node must exist
   - No duplicate node IDs
   - global_constraints.max_tu_weight_kg must be in (0, 200] if provided
   - global_constraints.max_tu_dimensions_cm all > 0 if provided
   - All edge distance_m >= 0
   - All edge max_throughput_tu_per_min > 0
4. System generates a 12-char internal `id`
5. System persists the sorter to the database
6. System returns the created sorter detail

**Result**: `201 Created` with sorter detail
**Error cases**:
- `400 Bad Request` — structural validation failure (missing/invalid fields)
- `409 Conflict` — sorter_id already exists
- `422 Unprocessable Entity` — semantic topology validation failure (with list of errors)

---

### UC-004: Update Sorter Topology
🔸 CODE_ONLY

**Actor**: WCS Operator / WCS Frontend
**Goal**: Replace the topology of an existing sorter

**Preconditions**: sorter_id exists

**Flow**:
1. Actor sends `PUT /api/sorters/{sorterId}/topology` with updated payload
2. System validates structural constraints (same as UC-003, step 2)
3. System validates semantic topology rules (same as UC-003, step 3)
4. System updates: sorter_name, constraints, nodes, edges, updated_at
5. System returns the updated sorter detail

**Result**: `200 OK` with updated sorter detail
**Error cases**:
- `400 Bad Request` — structural validation failure
- `404 Not Found` — sorter_id not registered
- `422 Unprocessable Entity` — semantic topology validation failure

---

### UC-005: Delete Sorter
🔸 CODE_ONLY

**Actor**: WCS Operator / WCS Frontend
**Goal**: Remove a sorter and its topology from the system

**Flow**:
1. Actor sends `DELETE /api/sorters/{sorterId}`
2. System verifies sorter exists
3. System deletes the sorter record permanently

**Result**: `204 No Content`
**Error cases**:
- `404 Not Found` — sorter_id not registered

---

### UC-006: View Full Topology
🔸 CODE_ONLY

**Actor**: WCS Frontend / Downstream routing system
**Goal**: Retrieve the complete topology of a sorter in a structured format with metadata

**Flow**:
1. Actor sends `GET /api/topology/{sorterId}`
2. System looks up sorter by sorter_id
3. System returns topology with `_meta` wrapper (node_count, edge_count, timestamps)

**Result**: `200 OK` with TopologyResponse (includes `_meta` key)
**Error cases**:
- `404 Not Found` — sorter_id not registered

---

### UC-007: View Exit Nodes (Topology Exits)
🔸 CODE_ONLY

**Actor**: WCS Frontend / Downstream routing system
**Goal**: Identify which nodes are exit points (leaf nodes with no outgoing edges)

**Algorithm**:
1. Build set of node IDs that appear as `from` in any edge
2. Exit nodes = nodes NOT in that set (no outgoing edges)
3. Return only id, name, capacity fields per exit node

**Flow**:
1. Actor sends `GET /api/topology_exits/{sorterId}`
2. System retrieves sorter
3. System computes leaf/exit nodes from graph
4. System returns exit list with metadata (total_nodes, exit_count)

**Result**: `200 OK` with TopologyExitsResponse
**Error cases**:
- `404 Not Found` — sorter_id not registered

---

## 4. Business Rules

| ID | Rule | Source |
|----|------|--------|
| BR-001 | `sorter_id` must be unique across all sorters | DB UNIQUE constraint + 409 response |
| BR-002 | A topology must have at least one node | TopologyValidator Rule 1 |
| BR-003 | No two nodes in the same topology may share the same `id` | TopologyValidator Rule 4 |
| BR-004 | If global_constraints.max_tu_weight_kg is provided, it must be > 0 and <= 200 | TopologyValidator Rule 2 |
| BR-005 | If global_constraints.max_tu_dimensions_cm is provided, length, width, height must all be > 0 | TopologyValidator Rule 3 |
| BR-006 | Edge distance_m must be >= 0 | TopologyValidator Rule 5 |
| BR-007 | Edge max_throughput_tu_per_min must be > 0 | TopologyValidator Rule 6 |
| BR-008 | Internal `id` is system-generated (12-char, immutable after creation) | SorterService.generateId() |
| BR-009 | Nodes list must not exceed 500 items | @Size annotation |
| BR-010 | Edges list must not exceed 2000 items | @Size annotation |
| BR-011 | Exit nodes are defined as nodes with no outgoing edges | SorterService.getTopologyExits() algorithm |

---

## 5. Data Models

### Sorter (persistent entity)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String (12 chars) | PK, immutable | System-generated, no dashes |
| sorter_id | String (max 64) | UNIQUE, required | Business identifier, external-facing |
| sorter_name | String (max 128) | required | Display name |
| global_constraints | Object (JSON) | optional | Global throughput/size limits |
| nodes | Array (JSON) | required, max 500 | Graph node list |
| edges | Array (JSON) | required, max 2000 | Graph edge list |
| created_at | DateTime | immutable, auto-set | ISO-8601 |
| updated_at | DateTime | auto-updated | ISO-8601 |

### global_constraints (JSON object)

| Field | Type | Validation |
|-------|------|-----------|
| max_tu_weight_kg | number | optional; if present: > 0 and <= 200 |
| max_tu_dimensions_cm.length | number | optional; if present: > 0 |
| max_tu_dimensions_cm.width | number | optional; if present: > 0 |
| max_tu_dimensions_cm.height | number | optional; if present: > 0 |

### Node (JSON object within nodes array)

| Field | Type | Notes |
|-------|------|-------|
| id | string | Required; unique within topology (BR-003) |
| name | string | Display name |
| type | string | Node type (e.g., "entry", "exit", "sorter") |
| capacity | number | Processing capacity |

### Edge (JSON object within edges array)

| Field | Type | Validation |
|-------|------|-----------|
| id | string | Edge identifier |
| from | string | Source node id |
| to | string | Target node id |
| distance_m | number | Must be >= 0 (BR-006) |
| max_throughput_tu_per_min | number | Must be > 0 (BR-007) |

---

## 6. Non-Functional Requirements

| Requirement | Value | Source |
|-------------|-------|--------|
| Observability | Distributed traces + metrics via OTel (traces, request count, duration, errors) | OTel SDK (Go) + OTel agent (Java) |
| Structured logging | JSON logs with trace_id + span_id correlation | logback-spring.xml + slog TraceHandler |
| CORS | Open (`*`) — all origins, methods, headers | WebConfig.java |
| DB schema versioning | Flyway migrations | V1__initial_schema.sql |
| Error format | RFC 9457 ProblemDetail (application/problem+json) | GlobalExceptionHandler |
| Production secrets | Injected via environment variables (Fury Secrets pattern) | application-production.yml |
