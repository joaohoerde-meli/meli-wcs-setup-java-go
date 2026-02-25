FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Download the OTel Java agent (zero-code auto-instrumentation).
# The agent automatically instruments Spring MVC, JDBC, and HTTP clients,
# enriches Logback MDC with trace_id/span_id, and exports via OTLP.
# Check https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases
# for the latest stable version before updating.
FROM eclipse-temurin:21-jre-jammy AS agent
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    wget -q -O /otel-agent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.5.0/opentelemetry-javaagent.jar && \
    apt-get purge -y wget && rm -rf /var/lib/apt/lists/*

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=agent /otel-agent.jar otel-agent.jar
EXPOSE 8081
ENTRYPOINT ["java", \
  "-javaagent:/app/otel-agent.jar", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
