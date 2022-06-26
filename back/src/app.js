import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const client = new MongoClient(process.env.URL_MONGODB);

let db;

db = client.connect().then(() => {
  db = client.db("batepapo-uol"); 
});

const app = express();

app.post("/participants", async (req, res) => {
  const userName = req.body;

  res.status(201).send("CRIADO");
});

app.listen(5000);