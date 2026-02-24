# meli-wcs-setup-java-go

WCS (Warehouse Control System) Topology Setup — hybrid **Go + Java Spring Boot 3** architecture.

## Architecture

```
┌──────────────────────────────────────────────────┐
│            External Clients                       │
│    (Warehouse Equipment / WCS Frontend)           │
└──────────────────┬───────────────────────────────┘
                   │ :8080
┌──────────────────▼───────────────────────────────┐
│            Go Service  (Gin)                      │
│  • High-performance I/O gateway                  │
│  • Reverse proxy for CRUD → Java service         │
│  • Direct fast-path handlers for hot reads:      │
│    GET /api/topology/:id                         │
│    GET /api/topology_exits/:id                   │
└──────────────────┬───────────────────────────────┘
                   │ :8081 (internal)
┌──────────────────▼───────────────────────────────┐
│         Java Service  (Spring Boot 3 / JPA)       │
│  • Full CRUD with transactional business logic   │
│  • Duplicate detection & validation              │
│  • Topology exits calculation                    │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│               MySQL 8  (Docker)                   │
└──────────────────────────────────────────────────┘
```

## Why Go + Java?

| Layer | Technology | Reason |
|-------|-----------|--------|
| I/O Gateway | Go (Gin) | Handles high-concurrency polling from warehouse equipment (~100ms intervals) with minimal overhead |
| Business Logic | Java 21 + Spring Boot 3 | Mature ecosystem for transactions, JPA, complex validation |
| Database | MySQL 8 | Reliable, enterprise-grade, Mercado Livre standard |

## Running

### Requirements
- Docker + Docker Compose

### Start everything

```bash
docker-compose up --build
```

Services after startup:
| Service | URL |
|---------|-----|
| Go gateway (public) | http://localhost:8080 |
| Java service (internal) | http://localhost:8081 |
| MySQL | localhost:3306 |

### Stop

```bash
docker-compose down
# To also remove data volume:
docker-compose down -v
```

## API Endpoints

All requests go through the **Go gateway** at **port 8080**.

### Sorters (management CRUD)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/sorters` | — | List all sorters |
| `GET` | `/api/sorters/:sorterId` | — | Get sorter detail |
| `POST` | `/api/sorters` | `TopologyPayload` | Create sorter |
| `PUT` | `/api/sorters/:sorterId/topology` | `TopologyPayload` | Update topology |
| `DELETE` | `/api/sorters/:sorterId` | — | Delete sorter (204) |

### Topology (high-performance reads for downstream services)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/topology/:sorterId` | Full topology with `_meta` |
| `GET` | `/api/topology_exits/:sorterId` | Exit nodes (leaf nodes) only |

### TopologyPayload schema
```json
{
  "sorter_id": "SORTER-01",
  "sorter_name": "Main Sorter",
  "global_constraints": {
    "max_speed": 2.5,
    "allowed_directions": ["forward", "left", "right"],
    "weight_limit": 50
  },
  "nodes": [
    { "id": "POS-001", "name": "Entry Point", "type": "entry", "capacity": 10, "x": 100, "y": 200 }
  ],
  "edges": [
    { "from": "POS-001", "to": "POS-002", "weight": 1, "direction": "forward" }
  ]
}
```

## Development (without Docker)

### Go service
```bash
cd go-service
go mod tidy
JAVA_SERVICE_URL=http://localhost:8081 PORT=8080 go run ./cmd
```

### Java service
Requires MySQL running locally (or use `docker-compose up mysql`).
```bash
cd java-service
SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/wcs_db?useSSL=false&allowPublicKeyRetrieval=true" \
SPRING_DATASOURCE_USERNAME=wcs_user \
SPRING_DATASOURCE_PASSWORD=wcs_pass \
./mvnw spring-boot:run
```
