import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'; 

import userRouter from './routes/user.js'
import cookieParser from 'cookie-parser';

dotenv.config();

const PORT = process.env.PORT || 3264;
const URL = process.env.MONGO_DB;

const app = express();

app.use(express.json());
app.use(cookieParser())

app.use(cors())

app.use("/api/user", userRouter)

app.get("/", (req, res) =>{
    res.send("welcome to my chat app")
    console.log("welcome to my chat app")
});

try {
  await mongoose.connect(URL);
  console.log("Database is connected successfully")
} catch (error) {
  console.log(error);
}


app.listen(PORT, ()=>{
    console.log(`Server is running at port:${PORT}`)
})

