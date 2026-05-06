import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.route.js";
import healthRouter from "./routes/healthCheck.routes.js";
import tweetRouter from "./routes/tweet.route.js";
import likeRouter from "./routes/like.route.js";


const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/comment",commentRouter);
app.use("/api/v1/health",healthRouter);
app.use("/api/v1/tweet",tweetRouter);
app.use("/api/v1/like",likeRouter);


export default app;