import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/etc/secrets/.env' });

let pool = null;

function getPool() {
    if (pool) {
        return pool;
    }

    try {
        const sslConfig = fs.existsSync('/etc/secrets/ca.pem')
            ? { ca: fs.readFileSync('/etc/secrets/ca.pem', 'utf8') }
            : undefined;

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            queueLimit: 0,
            ssl: sslConfig,
            connectionLimit: 10,
        }).promise();
    } catch (error) {
        console.warn('Database connection unavailable:', error.message);
        pool = null;
    }

    return pool;
}

export async function getEmployees() {
    const db = getPool();
    if (!db) {
        throw new Error('Database connection unavailable');
    }

    const [response] = await db.query('SELECT * FROM Employees;');
    return response;
}

export async function getEmployee(id) {
    const db = getPool();
    if (!db) {
        throw new Error('Database connection unavailable');
    }

    const [response] = await db.query('SELECT * FROM Employees WHERE id = ?;', [id]);
    return response;
}

export async function addEmployee(first_name, last_name) {
    const db = getPool();
    if (!db) {
        throw new Error('Database connection unavailable');
    }

    const result = await db.query('INSERT INTO Employees (first_name, last_name) VALUES (?, ?)', [first_name, last_name]);
    const id = result.insertId;
    return getEmployee(id);
}

export default getPool;
