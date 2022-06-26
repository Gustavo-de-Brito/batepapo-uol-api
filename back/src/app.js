import express, { json } from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import cors from "cors";
import dayjs from "dayjs";

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

// Custom validations

const isvalidTypeMessage = (type, helper) => {
  if(type === "message" || type === "private_message") {
    return true;
  } else {
    return helper.message("O tipo da mensagem deve ser 'message' ou 'private_message'");
  }
}

// schemas

const userNameSchema = joi.object(
  {
    name: joi.string().required()
  }
);

const messageSchema = joi.object(
  {
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().custom(isvalidTypeMessage)
  }
);

// TODO to e text strings não vazias
// TODO type só pode ser "message" ou "private_message"
// TODO from deve ser um participante presente na lista de participantes

// /participants route

app.post("/participants", async (req, res) => {
  const userName = req.body;

  const validUserName = userNameSchema.validate(userName);

  if(validUserName.error) {
    res.sendStatus(422);
    return;
  }

  try {
    const alreadyRegistrated = await db.collection("participants").findOne( userName );

    if(alreadyRegistrated) {
      res.sendStatus(409);
      return;
    }

    await db.collection("participants").insertOne({ ...userName, lastStatus: Date.now() });

    await db.collection("messages").insertOne(
      {
        from: userName.name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().format("HH:mm:ss")
      }
    );

    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  const participants = await db.collection("participants").find().toArray();

  res.status(200).send(participants);
});

// /messages route

// verification functions

const isVisualizeAllowed = (message, userName) => {
  return message.to === userName || message.from === userName || message.to === "Todos"
}

app.post("/messages", async (req, res) => {
  const message = req.body;
  const { user:sender } = req.headers;

  const validedMessage = messageSchema.validate(message);

  const registeredSender = await db.collection("participants").findOne( { name:sender }); 

  if(validedMessage.error || !registeredSender) {
    res.sendStatus(422);
    return;
  }

  try {
    const formatedMessage = {...message, from: sender, time: dayjs().format("HH:mm:ss")};
  
    await db.collection("messages").insertOne(formatedMessage);

    res.sendStatus(201);
  } catch(err) {
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  let { limit: qtdMessages } = req.query;
  const { user: userName } = req.headers;

  try {
    const allMessages = await db.collection("messages").find().toArray();

    const userAllowedMessages = allMessages.filter(message => isVisualizeAllowed(message, userName));

    if(!qtdMessages || qtdMessages > userAllowedMessages.length) {
      qtdMessages = userAllowedMessages.length;
    }

    const lastMessage = qtdMessages;

    //get from the last message to the specified limit
    const messages = [...userAllowedMessages].reverse().slice(0, qtdMessages);

    res.status(200).send(messages);
  } catch (err) {
    res.sendStatus(500);
  }
});

// /status route

app.post("/status", async (req, res) => {
  const { user: userName } = req.headers;
});

app.listen(5000);