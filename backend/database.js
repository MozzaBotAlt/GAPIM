import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/etc/secrets/.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    queueLimit: 0,
    ssl: { ca: fs.readFileSync('/etc/secrets/ca.pem', "utf8"), },
    connectionLimit: 10
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

export default pool;