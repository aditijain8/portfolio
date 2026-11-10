# syntax=docker/dockerfile:1
FROM eclipse-temurin:17-jdk AS build
WORKDIR /build
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package

FROM eclipse-temurin:17-jre
RUN useradd --system --uid 1001 --create-home app && mkdir -p /app/data && chown -R app /app
WORKDIR /app
COPY --from=build /build/target/portfolio-api-*.jar app.jar
USER app
# Tuned for small (512 MB) free-tier containers; override JAVA_OPTS on bigger hosts.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
ENV STORAGE_LOCAL_DIR=/app/data/files
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
