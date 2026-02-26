# Fury Services Status — Code Analysis

**Source**: Code analysis, FURY_MIGRATION.md
**Status**: PRE-FURY — Not yet migrated

## Current Fury Integration Level: NONE

The system currently uses zero Fury-specific SDKs or services.
Everything is standard open-source technology.

## Fury SDK Usage

| SDK | Status | Notes |
|-----|--------|-------|
| fury-go-core | ❌ Not used | Planned to replace Gin |
| fury httpclient | ❌ Not used | Planned to replace net/http |
| fury-spring-boot-starter | ❌ Not used | Not planned (vanilla Spring Boot) |
| Fury Secrets | ❌ Not used | Env vars prepared with ${...} placeholders |
| Fury MySQL | ❌ Not used | Local MySQL 8, migration pending |
| Fury BigQueue | ❌ Not used | Not applicable to this system |
| Fury KVS | ❌ Not used | Not applicable to this system |

## Planned Fury Migration (from FURY_MIGRATION.md)

### Step 1: Docker Images
```bash
fury images list --filter java
fury images list --filter go
# Replace Dockerfile placeholders:
# hub.furycloud.io/mercadolibre/fury_java:21-jre
# hub.furycloud.io/mercadolibre/fury_go_builder:1.22
# hub.furycloud.io/mercadolibre/fury_alpine:3.19
```

### Step 2: Go Service Migration
- Gin → fury-go-core httpserver
- otelgin → fury-go-core built-in telemetry
- OTel SDK → fury-go-core built-in telemetry
- net/http + otelhttp → fury httpclient
- **Requires**: FuryMCP documentation or internal Go core docs

### Step 3: Fury App Registration
```bash
fury app create wcs-go-service --lang go --team <your-team>
fury app create wcs-java-service --lang java --team <your-team>
```

### Step 4: MySQL Provisioning
- Provision via Fury Database service
- Create secret: WCS_DB_URL, WCS_DB_USERNAME, WCS_DB_PASSWORD

### Step 5: Fury Secrets
```bash
fury secret create WCS_DB_USERNAME --value "wcs_user" --app wcs-java-service
fury secret create WCS_DB_PASSWORD --value "<password>" --app wcs-java-service
```

### Step 6: Test
```bash
fury test --app wcs-java-service
fury test --app wcs-go-service
```

## Production Profile Ready

`application-production.yml` already uses Fury Secrets pattern:
```yaml
spring.datasource:
  url: ${SPRING_DATASOURCE_URL}
  username: ${SPRING_DATASOURCE_USERNAME}
  password: ${SPRING_DATASOURCE_PASSWORD}
```
