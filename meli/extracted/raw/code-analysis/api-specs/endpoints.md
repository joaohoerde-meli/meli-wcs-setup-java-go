# API Endpoints — Code Analysis

**Source**: Controller annotations + handler code
**Confidence**: 🔸 CODE_ONLY (no FuryMCP available)

## Go Gateway Public Routes (:8080)

All routes exposed by the Go gateway mirror the Java service routes, since Go proxies to Java.

| Method | Path | Go Handler | Description |
|--------|------|-----------|-------------|
| GET | /api/topology/:sorterId | GetTopology (direct) | Full topology with metadata |
| GET | /api/topology_exits/:sorterId | GetTopologyExits (direct) | Exit nodes only |
| GET | /api/sorters | ProxyToJava | List all sorters (summary) |
| GET | /api/sorters/:sorterId | ProxyToJava | Get sorter detail |
| POST | /api/sorters | ProxyToJava | Create new sorter |
| PUT | /api/sorters/:sorterId/topology | ProxyToJava | Update sorter topology |
| DELETE | /api/sorters/:sorterId | ProxyToJava | Delete sorter |

## Java Service REST API (:8081)

### SorterController — /api/sorters

#### GET /api/sorters
- **Response**: `200 OK` with `List<SorterSummary>`
- **Response body**:
  ```json
  [
    {
      "id": "abc123def456",
      "sorter_id": "SORTER-001",
      "sorter_name": "Main Sorter",
      "node_count": 5,
      "edge_count": 4,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ]
  ```

#### GET /api/sorters/{sorterId}
- **Path variable**: `sorterId` (business ID, VARCHAR(64))
- **Response**: `200 OK` with `SorterDetail`
- **Error**: `404 Not Found` (ProblemDetail)
- **Response body**:
  ```json
  {
    "id": "abc123def456",
    "sorter_id": "SORTER-001",
    "sorter_name": "Main Sorter",
    "global_constraints": { "max_tu_weight_kg": 25, ... },
    "nodes": [...],
    "edges": [...],
    "node_count": 5,
    "edge_count": 4,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
  ```

#### POST /api/sorters
- **Request body**: `TopologyPayload` (validated)
- **Response**: `201 Created` with `SorterDetail`
- **Errors**: `400 Bad Request` (validation), `409 Conflict` (duplicate sorter_id), `422 Unprocessable Entity` (semantic validation)
- **Request body**:
  ```json
  {
    "sorter_id": "SORTER-001",
    "sorter_name": "Main Sorter",
    "global_constraints": {
      "max_tu_weight_kg": 25,
      "max_tu_dimensions_cm": { "length": 100, "width": 80, "height": 60 }
    },
    "nodes": [
      { "id": "POS-001", "name": "Entry", "type": "entry", "capacity": 10 }
    ],
    "edges": [
      { "id": "E-001", "from": "POS-001", "to": "POS-002", "distance_m": 10.0, "max_throughput_tu_per_min": 60 }
    ]
  }
  ```

#### PUT /api/sorters/{sorterId}/topology
- **Path variable**: `sorterId` (business ID)
- **Request body**: `TopologyPayload` (validated)
- **Response**: `200 OK` with `SorterDetail`
- **Errors**: `400 Bad Request`, `404 Not Found`, `422 Unprocessable Entity`

#### DELETE /api/sorters/{sorterId}
- **Path variable**: `sorterId` (business ID)
- **Response**: `204 No Content`
- **Error**: `404 Not Found`

### TopologyController — /api

#### GET /api/topology/{sorterId}
- **Path variable**: `sorterId` (business ID)
- **Response**: `200 OK` with `TopologyResponse`
- **Error**: `404 Not Found`
- **Response body**:
  ```json
  {
    "id": "abc123def456",
    "sorter_id": "SORTER-001",
    "sorter_name": "Main Sorter",
    "global_constraints": { ... },
    "nodes": [...],
    "edges": [...],
    "_meta": {
      "node_count": 5,
      "edge_count": 4,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  }
  ```

#### GET /api/topology_exits/{sorterId}
- **Path variable**: `sorterId` (business ID)
- **Response**: `200 OK` with `TopologyExitsResponse`
- **Error**: `404 Not Found`
- **Response body**:
  ```json
  {
    "sorter_id": "SORTER-001",
    "sorter_name": "Main Sorter",
    "exits": [
      { "id": "POS-005", "name": "Exit A", "capacity": 20 }
    ],
    "_meta": {
      "total_nodes": 5,
      "exit_count": 1
    }
  }
  ```

## Error Response Format (ProblemDetail — RFC 9457)

All errors returned as `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Topology validation failed",
  "instance": "/api/sorters",
  "errors": [
    "Graph must contain at least one node.",
    "Duplicate node ID: POS-001"
  ]
}
```

## Validation Rules (TopologyPayload)

### Bean Validation (@Valid)
| Field | Constraint | Error |
|-------|-----------|-------|
| sorter_id | @NotBlank | "sorter_id is required" |
| sorter_id | @Size(max=64) | "sorter_id must be at most 64 characters" |
| sorter_name | @NotBlank | "sorter_name is required" |
| sorter_name | @Size(max=128) | "sorter_name must be at most 128 characters" |
| nodes | @NotNull | "nodes is required" |
| nodes | @Size(max=500) | "nodes list must not exceed 500 items" |
| edges | @NotNull | "edges is required" |
| edges | @Size(max=2000) | "edges list must not exceed 2000 items" |

### Semantic Validation (TopologyValidator)
| Rule | Condition | Error Message |
|------|----------|---------------|
| 1 | nodes empty | "Graph must contain at least one node." |
| 2 | max_tu_weight_kg not in (0, 200] | "Max TU weight must be between 0 and 200 kg." |
| 3 | any max_tu_dimensions_cm <= 0 | "All TU dimensions must be positive." |
| 4 | duplicate node IDs | "Duplicate node ID: {id}" |
| 5 | edge distance_m < 0 | "Edge {id}: distance must be >= 0." |
| 6 | edge max_throughput_tu_per_min <= 0 | "Edge {id}: throughput must be > 0." |
