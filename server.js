// Load .env if present. Variables already set in the environment win.
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const express = require("express");
const { Pool } = require("pg");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- SQL (Postgres) ----------
// Only created if PG_HOST is set. Pool connects lazily, so startup never fails.
let pgPool = null;
if (process.env.PG_HOST) {
  pgPool = new Pool({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    connectionTimeoutMillis: 3000,
  });
  pgPool.on("error", (err) => console.error("Postgres pool error:", err.message));
}

// ---------- NoSQL (DynamoDB) ----------
// Only created if DYNAMODB_TABLE is set. Credentials are resolved on first request.
let ddb = null;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
if (DYNAMODB_TABLE) {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-south-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // for DynamoDB Local
    maxAttempts: 1,
  });
  ddb = DynamoDBDocumentClient.from(client);
}

// ---------- Routes ----------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    sqlConfigured: Boolean(pgPool),
    nosqlConfigured: Boolean(ddb),
  });
});

// 1. Hardcoded data
app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from the AWS learning app",
    topics: ["EC2", "RDS", "DynamoDB", "IAM"],
  });
});

// 2. SQL: books table
app.get("/api/books", async (req, res) => {
  if (!pgPool) {
    return res.status(503).json({ error: "SQL database is not configured" });
  }
  try {
    const result = await pgPool.query(
      "SELECT id, title, author, published_year FROM books ORDER BY id"
    );
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("books query failed:", err.message);
    res.status(503).json({ error: "SQL database is unavailable" });
  }
});

// 3. NoSQL: movies table in DynamoDB
app.get("/api/movies", async (req, res) => {
  if (!ddb) {
    return res.status(503).json({ error: "NoSQL database is not configured" });
  }
  try {
    const result = await ddb.send(
      new ScanCommand({ TableName: DYNAMODB_TABLE, Limit: 50 })
    );
    res.json(result.Items || []);
  } catch (err) {
    console.error("movies scan failed:", err.message);
    res.status(503).json({ error: "NoSQL database is unavailable" });
  }
});

//4. MYSQL 

const mysql = require("mysql2/promise");

let mysqlPool = null;
if (process.env.MYSQL_HOST) {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
    connectTimeout: 3000,
  });
}

app.get("/", (req, res) => {
  res.json({ message: "Server is running", routes: ["/health", "/api/hello", "/api/books", "/api/movies"] });
});

app.get("/api/products", async (req, res) => {
  if (!mysqlPool) {
    return res.status(503).json({ error: "MySQL is not configured" });
  }
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, name, price FROM products ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error("products query failed:", err.message);
    res.status(503).json({ error: "MySQL is unavailable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SQL configured: ${Boolean(pgPool)}, NoSQL configured: ${Boolean(ddb)}`);
});
