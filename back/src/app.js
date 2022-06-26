import express, { json } from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import cors from "cors";

dotenv.config();

// Configurantion database
const client = new MongoClient(process.env.URL_MONGODB);

let db;

db = client.connect().then(() => {
  db = client.db("batepapo-uol"); 
});

const app = express();

app.use(json());
app.use(cors());

// schemas

const userNameSchema = joi.object(
  {
    name: joi.string().required()
  }
);

// participants route

app.post("/participants", async (req, res) => {
  const userName = req.body;

  const validUserName = userNameSchema.validate(userName);

  if(validUserName.error) {
    res.sendStatus(422);
    return;
  }

  try {
    await db.collection("participants").insertOne({ ...userName, lastStatus: Date.now() });

    res.sendStatus(201);
  } catch (err) {

  }

});

app.listen(5000);