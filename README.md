# Mansa Project

This repository contains separate frontend and backend applications.

- **frontend/**: React application built with TypeScript.
- **backend/**: Spring Boot REST API.

Both components have Dockerfiles and can be orchestrated together with a MySQL database using Docker Compose (`docker compose`).

Running all services locally:

```bash
docker compose up --build
```

The backend will automatically connect to the included MySQL container using
the credentials defined in `docker-compose.yml`. Adjust these credentials by
editing that file or setting environment variables for `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
