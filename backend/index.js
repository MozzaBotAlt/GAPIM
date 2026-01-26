import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import { getEmployees, getEmployee, addEmployee } from "./database.js";

//Constants
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 8080;
const baseurl = process.env.APP_URL;

//Route
const RUser = require('./routes/client');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after a minute",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//App settings
app.set("trust proxy", 20 /* number of proxies between user and server */);
app.disable("x-powered-by"); //Disabling fingerprinting
app.use(limiter); //Apply rate limiter to all requests
app.use(helmet()); //Apply helmet
app.use(express.json()); //Parse JSON bodies
app.use(express.urlencoded({ extended: false }));
dotenv.config({ path: '/etc/secrets/.env' });

//CORS settings
app.use(
  cors({
    origin: "*",
  })
);

//Request Handlers
app.use((req, res, next) => {
  console.log(`Client's IP: ${req.ip}`)
  next();
})

//Get Requests
app.get("/ip", (request, response) => {
  response.status(201).send(request.ip);
  console.log(`IP endpoint accessed from IP: ${request.ip}`);
});

app.get('/', (req, res) => {
  res.status(200).send(`Server OK`)
  console.log(`Root endpoint accessed from IP: ${req.ip}`)
});

app.get("/api/date", async (req, res) => {
  try {
    const currentDate = new Date();
    res.json({ date: currentDate });
    console.log(currentDate);
  } catch (error) {
    console.log(`Error:`, error);
  };
  console.log(`Date endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/dev", async (req, res) => {
  const dev = await getEmployees()
  res.send(dev);
  console.log(`Data endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/dev/:id", async (req, res) => {
  console.log(req.params);
  const id = req.params.id;
  const employee = await getEmployee(id)
  res.send(employee)
  console.log(`Dev Request endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/")

//Post Requests

app.post("/api/addemployee", async (req,res) => {
  const { first_name, last_name } = req.body;
  const employee = await addEmployee(first_name, last_name)
  console.log(`Employee Added`);
  res.status(201).send(`Success!`, employee);
});

app.post('/github/webhooks/', express.json({type: 'application/json'}), (request, response) => {
  response.status(202).send('Accepted');
  const githubEvent = request.headers['x-github-event'];

  if (githubEvent === 'issues') {
    const data = request.body;
    const action = data.action;
    if (action === 'opened') {
      console.log(`An issue was opened with this title: ${data.issue.title}`);
    } else if (action === 'closed') {
      console.log(`An issue was closed by ${data.issue.user.login}`);
    } else {
      console.log(`Unhandled action for the issue event: ${action}`);
    }
  } else if (githubEvent === 'ping') {
    console.log('GitHub sent the ping event');
  } else {
    console.log(`Unhandled event: ${githubEvent}`);
  }
});


//Router
app.get('/api/users', RUser);
app.get('/api/date', RUser);

//Port listen
app.listen(PORT, () => {
  console.info(`Server is running on ${baseurl}`);
});

// error handling
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).redirect(`${baseurl}`);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).redirect(`${baseurl}`);
});

//Similar endpoint redirect
app.get('/date', (req,res) => {
  res.redirect(`${basuerl}/api/date`)
});

app.get('/dev', (req,res) => {
  res.redirect(`${basuerl}/api/dev`)
});