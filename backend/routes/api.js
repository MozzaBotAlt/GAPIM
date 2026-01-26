import express from "express";
import { getEmployees, getEmployee, addEmployee } from "../database.js";

const router = express.Router();

// Get current date
router.get("/date", async (req, res) => {
  try {
    const currentDate = new Date();
    res.json({ date: currentDate });
    console.log(currentDate);
  } catch (error) {
    console.log(`Error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
  console.log(`Date endpoint accessed from IP: ${req.ip}`);
});

// Get all employees
router.get("/dev", async (req, res) => {
  try {
    const dev = await getEmployees();
    res.send(dev);
  } catch (error) {
    console.log(`Error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
  console.log(`Data endpoint accessed from IP: ${req.ip}`);
});

// Get employee by ID
router.get("/dev/:id", async (req, res) => {
  try {
    console.log(req.params);
    const id = req.params.id;
    const employee = await getEmployee(id);
    res.send(employee);
  } catch (error) {
    console.log(`Error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
  console.log(`Dev Request endpoint accessed from IP: ${req.ip}`);
});

// Add employee
router.post("/addemployee", async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const employee = await addEmployee(first_name, last_name);
    console.log(`Employee Added`);
    res.status(201).json({ message: "Success!", employee });
  } catch (error) {
    console.log(`Error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
