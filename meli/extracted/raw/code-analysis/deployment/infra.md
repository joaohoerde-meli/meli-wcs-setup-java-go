# Deployment & Infrastructure — Code Analysis

**Source**: docker-compose.yml, Dockerfiles, otel-collector-config.yaml
**Confidence**: 🔸 CODE_ONLY

## Current State: LOCAL DEVELOPMENT ONLY

Docker Compose is explicitly marked as LOCAL DEV ONLY. Fury migration is pending.

## Docker Compose Services

### mysql (MySQL 8.0)
```
Image:   mysql:8.0
Port:    3306:3306
Volume:  mysql_data:/var/lib/mysql
Health:  mysqladmin ping (10s interval, 5s timeout, 10 retries)
Env:
  MYSQL_ROOT_PASSWORD: root
  MYSQL_DATABASE:      wcs_db
  MYSQL_USER:          wcs_user
  MYSQL_PASSWORD:      wcs_pass
```

### otel-collector (0.104.0)
```
Image:   otel/opentelemetry-collector-contrib:0.104.0
Ports:   4317:4317 (gRPC), 4318:4318 (HTTP)
Config:  ./otel-collector-config.yaml (read-only mount)
Note:    Remove when deploying to Fury
```

### java-service (built)
```
Build:   ./java-service/Dockerfile
Port:    8081:8081
DependsOn: mysql (healthy), otel-collector (started)
Restart: on-failure
Env:
  SPRING_DATASOURCE_URL:      jdbc:mysql://mysql:3306/wcs_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
  SPRING_DATASOURCE_USERNAME: wcs_user
  SPRING_DATASOURCE_PASSWORD: wcs_pass
  SPRING_PROFILES_ACTIVE:     ${SCOPE:-development}
  OTEL_SERVICE_NAME:          wcs-java-service
  OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
  OTEL_RESOURCE_ATTRIBUTES:   deployment.environment=${SCOPE:-development}
  OTEL_INSTRUMENTATION_SPRING_WEBMVC_ENABLED: "true"
  OTEL_INSTRUMENTATION_JDBC_ENABLED:          "true"
  OTEL_INSTRUMENTATION_LOGBACK_APPENDER_ENABLED: "true"
```

### go-service (built)
```
Build:   ./go-service/Dockerfile
Port:    8080:8080
DependsOn: java-service, otel-collector
Restart: on-failure
Env:
  JAVA_SERVICE_URL:           http://java-service:8081
  PORT:                       8080
  SCOPE:                      ${SCOPE:-development}
  OTEL_SERVICE_NAME:          wcs-go-service
  OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
  OTEL_RESOURCE_ATTRIBUTES:   deployment.environment=${SCOPE:-development}
```

## Java Dockerfile (Multi-stage, 3 stages)

```
Stage 1: BUILD
  Base: maven:3.9.6-eclipse-temurin-21-alpine
  Output: /app/target/*.jar

Stage 2: AGENT
  Base: eclipse-temurin:21-jre-jammy (TODO: fury_java:21-jre)
  Downloads: opentelemetry-javaagent v2.5.0
  Output: /otel-agent.jar

Stage 3: RUNTIME
  Base: eclipse-temurin:21-jre-jammy (TODO: fury_java:21-jre)
  Copies: app.jar + otel-agent.jar
  Expose: 8081
  Entrypoint: java -javaagent:/app/otel-agent.jar -jar app.jar
```

TODOs:
- Replace `eclipse-temurin:21-jre-jammy` with `hub.furycloud.io/mercadolibre/fury_java:21-jre`
- Remove OTel agent stage (Fury platform handles instrumentation)

## Go Dockerfile (Multi-stage, 2 stages)

```
Stage 1: BUILD
  Base: golang:1.22-alpine (TODO: fury_go_builder:1.22)
  Output: /go-service (static binary, CGO_ENABLED=0)

Stage 2: RUNTIME
  Base: alpine:3.19 (TODO: fury_alpine:3.19)
  Copies: go-service binary
  Expose: 8080
  CMD: ./go-service
```

TODOs:
- Replace `golang:1.22-alpine` with `hub.furycloud.io/mercadolibre/fury_go_builder:1.22`
- Replace `alpine:3.19` with `hub.furycloud.io/mercadolibre/fury_alpine:3.19`

## OTel Collector Config

```yaml
Receivers:  OTLP (gRPC :4317, HTTP :4318)
Processors: batch (5s timeout, 512 batch size)
Exporters:  debug (stdout, verbosity: normal)
Pipelines:  traces + metrics + logs
Note:       Swap debug exporter for real backend in production
```

## Environment Variables Reference

### Go Service (all)
| Variable | Default | Purpose |
|----------|---------|---------|
| PORT | 8080 | HTTP listen port |
| JAVA_SERVICE_URL | http://localhost:8081 | Upstream Java URL |
| SCOPE | development | Deployment scope |
| OTEL_SERVICE_NAME | wcs-go-service | OTel service name |
| OTEL_SERVICE_VERSION | 1.0.0 | OTel service version |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://localhost:4317 | OTLP endpoint |
| OTEL_EXPORTER_OTLP_PROTOCOL | http/protobuf | OTLP protocol |
| OTEL_TRACES_SAMPLER | — | Sampling strategy |

### Java Service (all)
| Variable | Default | Purpose |
|----------|---------|---------|
| PORT | 8081 | HTTP listen port |
| SPRING_DATASOURCE_URL | (required) | MySQL JDBC URL |
| SPRING_DATASOURCE_USERNAME | (required) | DB username |
| SPRING_DATASOURCE_PASSWORD | (required) | DB password |
| SPRING_PROFILES_ACTIVE | development | Spring profile |
| OTEL_SERVICE_NAME | wcs-java-service | OTel service name |
| OTEL_EXPORTER_OTLP_ENDPOINT | (required) | OTLP endpoint |
| OTEL_EXPORTER_OTLP_PROTOCOL | http/protobuf | OTLP protocol |
