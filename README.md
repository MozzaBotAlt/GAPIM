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
