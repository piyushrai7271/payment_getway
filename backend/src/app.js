import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN  || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//import routes
import userAuthRoutes from "../src/routes/userAuth.routes.js";

app.use("/api/user",userAuthRoutes);




export default app;