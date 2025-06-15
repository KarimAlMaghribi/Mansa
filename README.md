# XRisk Frontend

## General
This is the frontend for the XRisk project. It is built using React and Typescript.


## Configuration

Create a `.env` file based on `.env.example` and provide your Firebase credentials there. The application reads these variables via `REACT_APP_FIREBASE_*` keys.

Ensure that the `.env` file is **not** committed to version control. The included `.gitignore` already excludes it for safety.

## Firebase Deployment
The repository includes a GitHub Actions workflow that deploys the application to Firebase Hosting. The deployment step expects a `FIREBASE_TOKEN` environment variable. Add this token as a repository secret named `FIREBASE_TOKEN` to allow the workflow to authenticate with Firebase.

To generate a token run `firebase login:ci` locally and copy the resulting token. For local development you can also create a `.env` file with:

```bash
FIREBASE_TOKEN=YOUR_TOKEN_HERE
```

The token must not be committed to the repository.
