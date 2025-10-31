import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import 'dotenv/config';
import { getEmployees, getEmployee, addEmployee } from "./database.js";

const app = express();
const PORT = process.env.PORT || 8080;

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
  next();
})

//Get Requests
app.get("/ip", (request, response) => {
  response.status(201).send(request.ip);
  console.log(`IP endpoint accessed from IP: ${req.ip}`);
});

app.get('/', (req, res) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK' })
  };
  console.log(`Root endpoint accessed from IP: ${req.ip}`);
});

app.get("/api/date", (req, res) => {
  const currentDate = new Date();
  res.json({ date: currentDate });
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

//Post Requests

app.post("/api/addemployee", async (req,res) => {
  const { first_name, last_name } = req.body;
  const employee = await addEmployee(first_name, last_name)
  console.log(`Employee Added`);
  res.status(201).send(`Success!`, employee);
});

//Port listen
app.listen(PORT, () => {
  console.info(`Server is running on https://lvm-backend-j0ws.onrender.com/`);
});

//extra codes
/*app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Internal Server Error')
})*/