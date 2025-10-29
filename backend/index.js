import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import logger from "./logger.js";
import dotenv from "dotenv";
import database from "./databse.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after a minute",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//App settings
app.set("trust proxy", 10 /* number of proxies between user and server */);
app.disable("x-powered-by"); //Disabling fingerprinting
app.use(limiter); //Apply rate limiter to all requests
app.use(helmet()); //Apply helmet
app.use(express.json()); //Parse JSON bodies
logger.info("Logger initialized");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//CORS settings
app.use(
  cors({
    origin: "*",
  })
);

//Request Handlers
app.use((request, response, next) => {
  console.log(`Client's IP: ${request.ip}`)
  logger.info(`Client's IP: ${request.ip}`)
  next();
})

//Get Requests
app.get("/ip", (request, response) => {
  response.status(201).send(request.ip);
  logger.info(`IP endpoint accessed from IP: ${req.ip}`);
  console.log(`IP endpoint accessed from IP: ${req.ip}`);
});

app.get('/', (req, res) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK' })
  };
  logger.info(`Root endpoint accessed from IP: ${req.ip}`);
  console.log(`Root endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/date", (req, res) => {
  const currentDate = new Date();
  res.json({ date: currentDate });
  logger.info(`Date endpoint accessed from IP: ${req.ip}`);
  console.log(`Date endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/dev", (req, res) => {
  res.json();
  logger.info(`Data endpoint accessed from IP: ${req.ip}`);
  console.log(`Data endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/dev/:name", (req, res) => {
  console.log(req.params);
  const { name } = req.params;
  const user = dev.find((user) => user.name === name);
    if (user) res.status(200).send(user);
    else res.status(404).send(`Not Found`);
  logger.info(`Dev endpoint accessed from IP: ${req.ip}`);
  console.log(`Dev endpoint accessed from IP: ${req.ip}`);
});

//Post Requests
/*
app.post("/", (req,res) => {
  const user = req.body;
  data.push(user);
  console.log(`created new user`);
  res.status(201).send(`user created`);
});
*/
//Port listen
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

//extra codes