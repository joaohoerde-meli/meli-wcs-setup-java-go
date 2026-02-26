# ─────────────────────────────────────────────────────────────────────────────
# TODO (Fury migration): Replace all base images with your team's
# hub.furycloud.io equivalents. Run the following to discover available images:
#   fury images list --filter java
# Example names (confirm with your squad):
#   hub.furycloud.io/mercadolibre/fury_java_builder:21
#   hub.furycloud.io/mercadolibre/fury_java:21-jre
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1 — build
# TODO: replace with hub.furycloud.io/mercadolibre/fury_java_builder:21 (or team equivalent)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2 — OTel Java agent
# NOTE (Fury): In production the OTel agent and OTLP endpoint are provided by
# the Fury platform runtime. This stage is kept for local/docker-compose usage.
# On Fury, remove this stage and the -javaagent flag from the ENTRYPOINT.
# TODO: replace with hub.furycloud.io/mercadolibre/fury_java:21-jre (or team equivalent)
FROM eclipse-temurin:21-jre-jammy AS agent
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    wget -q -O /otel-agent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.5.0/opentelemetry-javaagent.jar && \
    apt-get purge -y wget && rm -rf /var/lib/apt/lists/*

# Stage 3 — runtime
# TODO: replace with hub.furycloud.io/mercadolibre/fury_java:21-jre (or team equivalent)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=agent /otel-agent.jar otel-agent.jar
EXPOSE 8081
ENTRYPOINT ["java", \
  "-javaagent:/app/otel-agent.jar", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
