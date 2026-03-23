# Etapa 1: Build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle buildFatJar --no-daemon

# Etapa 2: Runtime
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]