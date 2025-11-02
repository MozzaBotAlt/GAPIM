import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from "fs";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
    ssl: { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH) }
}).promise();

export async function getEmployees() {
    try {
        const [response] = await pool.query("SELECT * FROM Employees;");
        return response;
    } catch(error) {
        console.log(error);
    }
}

export async function getEmployee(id) {
    try {
        const [response] = await pool.queery('SELECT * FROM Employees WHERE id = ?;', [id]);
        return response;
    } catch(error) {
        console.log(error);
    }
}

export async function addEmployee(first_name, last_name) {
    try {
        const result = await pool.query(`INSERT INTO Employees (first_name, last_name) VALUES (?, ?)`, [first_name, last_name])
        const id = result.insertId;
        return getEmployee(id);
    } catch(error) {
        console.log(error);
    }
}

const employees = getEmployees()
console.log(employees)

const employee = getEmployees(1)
console.log(`The main web dev:` + employee)

export default pool;