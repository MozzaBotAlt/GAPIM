import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

export async function getEmployees() {
    const [response] = await pool.query("SELECT * FROM Employees;");
    return response;
}

export async function getEmployee(id) {
    const [response] = await pool.queery('SELECT * FROM Employees WHERE id = ?;', [id]);
    return response;
}

export async function addEmployee(first_name, last_name) {
    const result = await pool.query(`INSERT INTO Employees (first_name, last_name) VALUES (?, ?)`, [first_name, last_name])
    const id = result.insertId;
    return getEmployee(id);
}

const result = await addEmployee('John', 'Doe');
console.log(result);

const employee = await getEmployees(1);
console.log(employee);