<h1 align="center">General API of MozzaBot Websites</h1>
<h3 align="center">GAPIM</h3>


<div align="center">
  <strong>Backend API of All MozzaBot Sites</strong>
</div>


# Introduction
Use of this is for educational purposes only

## URL to API
URL to API is as listed below:
- [Render](https://lvm-backend-j0ws.onrender.com)

## API Endpoints

### General Endpoints
- `GET /` - Server status check
- `GET /ip` - Returns client's IP address
- `GET /date` - Redirects to `/api/date`
- `GET /dev` - Redirects to `/api/dev`

### API Routes (`/api`)
- `GET /api/date` - Returns current date
- `GET /api/dev` - Returns all employees
- `GET /api/dev/:id` - Returns specific employee by ID
- `POST /api/addemployee` - Add new employee (requires `first_name` and `last_name` in body)

### Hmm
Send JSON with a non-empty `message` string (maximum 10,000 characters); `userId` and `metadata` are optional. Configure `DATABASE_URL`, or `PGHOST`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`. Locally, the backend reads `backend/.env` or `backend/process.env`; on hosts, set `SECRETS_FILE` or provide environment variables directly. Set `PUBLIC_SITE_URL` to the browser frontend origin and `TRUST_PROXY_HOPS` to the number of trusted reverse proxies in production. Never commit populated secret files.

### JSON settings storage
- `GET /infositemrsm` - Pull the saved settings JSON document
- `POST /infositemrsm` - Push a new settings JSON document
- `PUT /infositemrsm` - Replace the saved settings JSON document

The backend stores the whole request body as PostgreSQL `JSONB` in the `json_documents` table. On first startup, the `infositemrsm` document is initialized from `settings/n.json` when that file is present. If it is absent, the default is one blank slide (with template `1` and duration `5`), empty announcements, and `settings.slidingText` set to an empty string. `settings/m.json` lists the available slide template IDs.

Example:

```bash
curl -X PUT http://gapim.onrender.com/infositemrsm \
  -H "Content-Type: application/json" \
  -d '{"slides":[{"title":"Welcome","message":"Hello","duration":5,"template":1}],"announcements":[],"settings":{"slidingText":"Welcome!"}}'

curl http://gapim.onrender.com/infositemrsm
```

`POST` returns `201 Created`; `PUT` replaces the same document and returns `200 OK`. Both methods accept a JSON request body, and `GET` returns the stored JSON directly. The existing database connection settings above are required.

### Webhooks
- `POST /github/webhooks/` - GitHub webhook handler for issues and ping events

## Bugs?
Bugs? Any ideas for improvements? Feedback?
Tell us on:
1. 231046@langkawi.mrsm.edu.my

## Credits
Credits:
1. Ali Mozzabot I... Team Principal...            Website Developer...      [Github](https://github.com/RaspberryPiNArduinoUser)
2. Eiko...             Right Hand Man(RHM)...     Graphic Designer...       [Github](https://github.com/zhafryanir)

## Notes

To do list:
1. Security: [resource](https://www.youtube.com/watch?v=FsB_nRGdeLs)
