import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/db.js";
import app from "./app.js";

connectDB()
.then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port", process.env.PORT || 3000);
  });
})
.catch(err => {
  console.log("MongoDB connection failed", err);
});
// Routes


























// import express from "express";

// const app=express();
// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",()=>{
//         console.log("ERROR:",error);
//         throw error
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`APP is Listning on Port ${process.env.PORT}`)
//     })
//     } catch (error) {
//         console.log("ERROR:",error);
//         throw error
//     }
// })()
