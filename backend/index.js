import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import dotenv from "dotenv"
import userRoute from "./routes/user.route.js"

dotenv.config({})
const app = express()




app.get("/", (req,res)=>{
    return res.status(200).json({
        message:"hello yo yo",
        success:true
    })
})

app.use(express.json())
app.use(urlencoded({extended:true}))
app.use(cookieParser())
const corsOptions = {
    origin:'http://localhost:5173',
    credentials: true
}

app.use(cors(corsOptions))
const PORT = 8000

app.use("/api/v1/user", userRoute)


app.listen(PORT, ()=>{
    connectDB()
    console.log(`app is running at port ${PORT}`)
})