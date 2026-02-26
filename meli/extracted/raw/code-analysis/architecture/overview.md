# Architecture Overview — Code Analysis

## System Architecture

```
External Client (Frontend / API Consumer)
        │
        ▼  HTTP :8080
┌───────────────────┐
│   Go Gateway      │  Gin v1.10.0
│   wcs-go-service  │  OTel instrumented
│   (go-service/)   │
└────────┬──────────┘
         │  HTTP :8081  (reverse proxy / direct calls)
         ▼
┌───────────────────┐
│   Java Service    │  Spring Boot 3.2.3, Java 21
│ wcs-java-service  │  JPA + Flyway + OTel agent
│  (java-service/)  │
└────────┬──────────┘
         │  JDBC :3306
         ▼
┌───────────────────┐
│     MySQL 8       │
│     wcs_db        │
│  sorters table    │
└───────────────────┘
         │
         ▼  OTLP/HTTP :4318
┌───────────────────┐
│  OTel Collector   │  (Local dev only)
│  (0.104.0)        │  → stdout debug exporter
└───────────────────┘
```

## Go Service Details

- **Framework**: Gin v1.10.0
- **Role**: API gateway and reverse proxy
- **Port**: 8080
- **Routing strategy**:
  - Direct (with OTel metrics): `GET /api/topology/:sorterId` and `GET /api/topology_exits/:sorterId`
  - Transparent proxy: all other `ANY /api/*path` routes
- **HTTP client**: 10s timeout, otelhttp transport, connection pool (100 max idle, 20 per host)
- **Observability**: OTel SDK (traces + metrics), structured slog with trace correlation

## Java Service Details

- **Framework**: Spring Boot 3.2.3, Java 21
- **Role**: Business logic, data persistence
- **Port**: 8081
- **Database**: MySQL 8 via Hibernate JPA + Flyway
- **Validation**: Two-layer (Jakarta Bean Validation + semantic TopologyValidator)
- **Error handling**: GlobalExceptionHandler using RFC 9457 ProblemDetail responses
- **Observability**: OTel Java agent (auto-instrumentation), Logstash structured logs

## Module Boundaries

| Module | Responsibility |
|--------|---------------|
| Go gateway (handlers.go) | Route, proxy, OTel metrics |
| Go gateway (java_client.go) | HTTP client with trace propagation |
| Java SorterController | REST CRUD for /api/sorters |
| Java TopologyController | Read-only topology views |
| Java SorterService | Business logic + topology calculations |
| Java TopologyValidator | Semantic graph validation rules |
| Java GlobalExceptionHandler | Unified error response format |
| Java SorterRepository | JPA data access layer |

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Gateway language | Go | 1.22 |
| Gateway framework | Gin | v1.10.0 |
| Service language | Java | 21 |
| Service framework | Spring Boot | 3.2.3 |
| Persistence | Hibernate JPA | (Spring Boot managed) |
| Database | MySQL | 8.0 |
| Schema migration | Flyway | (Spring Boot managed) |
| Observability | OpenTelemetry | SDK v1.28.0 (Go), agent v2.5.0 (Java) |
| Containerization | Docker | Multi-stage Dockerfiles |
| Local orchestration | Docker Compose | — |
