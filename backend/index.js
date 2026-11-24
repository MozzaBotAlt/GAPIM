/* Copyright (C) 2026 MozzaBot This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createRequire } from "node:module";
import apiRouter from "./routes/api.js";
import { registerInfositemrsmRoutes } from "./infositemrsm/lgk/script.js";
import { initializeDatabase, saveIncomingRequest } from "./database.js";

//Constants
const require = createRequire(import.meta.url);
const paywall = require("./paywall/index.js");
const app = express();
const PORT = process.env.PORT || 8080;
const baseurl = process.env.APP_URL;
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
const publicSiteOrigins = (process.env.PUBLIC_SITE_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after a minute",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

console.print(`Copyright (C) 2026 MozzaBot This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.")`);

//App settings
app.set("trust proxy", process.env.NODE_ENV === "production" ? trustProxyHops : false);
app.disable("x-powered-by"); //Disabling fingerprinting
app.use(limiter); //Apply rate limiter to all requests
app.use(helmet()); //Apply helmet
app.use(express.json()); //Parse JSON bodies
app.use(express.urlencoded({ extended: false }));

//CORS settings
/*app.use(
  cors({
    origin: publicSiteOrigins.length
      ? publicSiteOrigins
      : process.env.NODE_ENV === "production"
        ? true
        : "*",
  })
);
*/
//cors v2
/*const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (like Postman, curl, or mobile apps)
    if (!origin) return callback(null, true);

    // 2. Check against your allowlist if defined
    /*if (publicSiteOrigins.length > 0) {
      if (publicSiteOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }

    // 3. In development, reflect the exact requesting origin instead of '*'
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // 4. Block everything in production if publicSiteOrigins is empty
    return callback(null, false);
  },
  credentials: true, // Step 1: Allows cookies & Authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Step 2: Explicit preflight methods
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], // Step 2: Explicit preflight headers
  optionsSuccessStatus: 204, // Step 2: Clean preflight status for all browsers
};*/

//cors v3
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: '*',
}));

//Request Handlers
//app.use(paywall);

app.use((req, res, next) => {
  console.log(`Client's IP: ${req.ip}`);
  next();
});

app.use((req, res, next) => {
  if (req.method === "PUT") {
    void saveIncomingRequest(req).catch((error) => {
      console.warn("Could not persist PUT request payload:", error.message);
    });
  }
  next();
});

//Get Requests
app.get("/ip", (request, response) => {
  response.status(201).send(request.ip);
  console.log(`IP endpoint accessed from IP: ${request.ip}`);
});

app.get("/", (req, res) => {
  res.status(200).send("Server OK");
  console.log(`Root endpoint accessed from IP: ${req.ip}`);
});

// Use API router
app.use("/api", apiRouter);
registerInfositemrsmRoutes(app);

app.post("/github/webhooks/", express.json({ type: "application/json" }), (request, response) => {
  response.status(202).send("Accepted");
  const githubEvent = request.headers["x-github-event"];

  if (githubEvent === "issues") {
    const data = request.body;
    const action = data.action;
    if (action === "opened") {
      console.log(`An issue was opened with this title: ${data.issue.title}`);
    } else if (action === "closed") {
      console.log(`An issue was closed by ${data.issue.user.login}`);
    } else {
      console.log(`Unhandled action for the issue event: ${action}`);
    }
  } else if (githubEvent === "ping") {
    console.log("GitHub sent the ping event");
  } else {
    console.log(`Unhandled event: ${githubEvent}`);
  }
});

//Similar endpoint redirect
app.get("/date", (req, res) => {
  res.redirect(`${baseurl || `http://localhost:${PORT}`}/api/date`);
});

app.get("/dev", (req, res) => {
  res.redirect(`${baseurl || `http://localhost:${PORT}`}/api/dev`);
});

app.use((req, res) => {
  console.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: "not_found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error.message);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "internal_server_error" });
});

const databaseReady = await initializeDatabase();
if (!databaseReady) {
  throw new Error("Database initialization did not complete; refusing to start.");
}
console.info("Database tables are ready.");

app.listen(PORT, '0.0.0.0', () => {
  console.info(`Server is running on ${baseurl || `http://localhost:${PORT}`}`);
});
