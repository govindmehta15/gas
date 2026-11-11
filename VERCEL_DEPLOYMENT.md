# Vercel deployment

App root: `grs` relative to personal_projects; set the equivalent Root Directory relative to the imported Git repository.

Dependencies and builds run on Vercel. No local install is required. Use a Preview deployment first; cloud compilation has not yet been verified.

Web dashboard only; Arduino/ESP32 firmware runs on hardware. Configure reachable device endpoints.

Environment variable names referenced in source (not all are required):

- `MONGODB_URI`

Set Node.js 22.x for Node apps. For nested workspace apps, retain their workspace lockfile and allow source access outside the app root. Do not place server secrets in client-prefixed variables.
