# Build‐Stage bleibt gleich …
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime‐Stage
FROM eclipse-temurin:17-jre
WORKDIR /app
# genau das fat‐jar kopieren, nicht nur wildcard *jar
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
