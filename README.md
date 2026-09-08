# Test Solver AI

A minimal installable phone web app (PWA) that:
- uploads PDFs/documents/images,
- takes camera photos,
- sends the complete paper to the OpenAI Responses API,
- returns a complete worked memorandum,
- lets you copy or Print / Save PDF.

## Required environment variable

OPENAI_API_KEY=your_secret_key

Optional:
OPENAI_MODEL=gpt-5.6

## Run locally

npm install
npm start

Open http://localhost:3000

## Deploy

Deploy this Node project to any Node-compatible host.
Set OPENAI_API_KEY as a secret/environment variable on the host.
Do NOT put the API key in public/app.js or any browser file.

## Phone installation

Open the deployed HTTPS URL in Chrome on Android.
Use the browser menu -> Add to Home screen / Install app.
