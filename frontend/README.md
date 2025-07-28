# Mansa Frontend

## General
This is the frontend for the Mansa project. It is built using React and Typescript.


## Configuration

Create a `.env` file based on `.env.example` and define the following variables:

```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
REACT_APP_BACKEND_URL
```

`REACT_APP_BACKEND_URL` should point to the deployed backend, for example `https://mansa-backend-982712811758.europe-west3.run.app`.

Ensure that the `.env` file is **not** committed to version control. The included `.gitignore` already excludes it for safety.

## Firebase Deployment
The repository includes a GitHub Actions workflow that deploys the application to Firebase Hosting. The deployment step expects a `FIREBASE_TOKEN` environment variable. Add this token as a repository secret named `FIREBASE_TOKEN` to allow the workflow to authenticate with Firebase.

To generate a token run `firebase login:ci` locally and copy the resulting token. For local development you can also create a `.env` file with:

```bash
FIREBASE_TOKEN=YOUR_TOKEN_HERE
```

The token must not be committed to the repository.

## Backend (Spring Boot)

A simple Spring Boot backend lives in the `backend` directory. It exposes a demo endpoint at `/api/hello` returning a greeting string.

To start the backend locally:

```bash
cd backend
./mvnw spring-boot:run
```

The frontend component at `/hello-backend` fetches this endpoint using the `REACT_APP_BACKEND_URL` value. By default it points to `http://localhost:8080` for local development.
