# RqJey Mods 3.1 — private admin edition

This branch adds a server-backed content editor while preserving the existing Aurora site and GitHub Releases download flow.

## What changed

- The public catalog loads editable project metadata from `GET /api/content`.
- On static GitHub Pages the API is unavailable, so the existing `config.js` metadata remains the fallback.
- The private editor is served at `/control-room`; `/admin.html` is not served directly.
- Login uses environment variables, an HttpOnly SameSite session cookie, CSRF checks, and temporary IP throttling.
- Content is validated and stored in `data/content.json`.
- `render.yaml` configures a Render Node.js web service and persistent disk.

The private URL is not a substitute for authentication: protected API operations enforce a valid server session.

## Deploy on Render

1. Create a Render Blueprint from this repository and select the `feature/private-admin-panel` branch, or merge the pull request into `main` first.
2. Confirm the web service from `render.yaml`. The persistent disk requires a paid Render plan.
3. In the service Environment settings, set `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Use a unique password of at least 16 characters. Never commit credentials or send them in chat.
4. Wait for a successful deploy and open the Render service URL followed by `/control-room`.
5. To use the existing domain, add it under Render Custom Domains and update DNS using Render's instructions. Keep the current GitHub Pages site active until the Render service and domain have been verified.

## Local run

Requires Node.js 20+.

PowerShell:
```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="replace-with-a-unique-password-of-at-least-16-characters"
$env:NODE_ENV="development"
npm start
```

Open `http://localhost:3000/control-room`. Replace the example password before using this outside a local test.

## Content and releases

The editor changes project names, icons, categories, Minecraft versions, descriptions, accent colors, and feature lists. Releases and downloadable JAR files continue to come from the public `RqJey/Minecraft-Mods` GitHub Releases API. The editor does not publish releases or upload JAR files.

On Render, keep the persistent disk mounted at `/opt/render/project/src/data`. Removing that disk can permanently remove edited content.
