import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { connectToDb } from "./db/db.js";
import { verifySesssion } from "./middlewares/auth.middleware.js";
import authRoute from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import qaRoutes from "./routes/qa.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { UserModel } from "./models/User.model.js";
import ExpressMongoSanitize from "express-mongo-sanitize";
import * as useragent from "express-useragent";

config();

const app = express();
const PORT = process.env.PORT || 3000;
const origin = process.env.ORIGIN;

app.use(
  cors({
    origin: [origin],
    credentials: true,
  })
);

app.use(useragent.express());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//mongo sanitize setup
app.use(ExpressMongoSanitize());
app.use(authRoute);
app.get("/authenticated", verifySesssion, (req, res) => {
  // console.log(req.user);
  res.send(true);
});

app.get("/", (req, res) => {
  res.send("Welcome to the chatbot server");
});

app.get("/api/v1/users/me", verifySesssion, async (req, res) => {
  const { user } = req.user;
  const completeUser = await UserModel.aggregate([
    { $match: { _id: user } },
    { $project: { password: 0, _id: 0, chats: 0 } },
  ]);
  res.send(completeUser);
});
app.use("/api/v1", verifySesssion, qaRoutes);
app.use("/api/v1", verifySesssion, fileRoutes);
app.use("/api/v1", verifySesssion, chatRoutes);
app.get("/api/v1", verifySesssion, (req, res) => {
  // console.log(req.user, "userDetails");
  res.send("App is available!");
});

// Start the server
const startListening = () =>
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

connectToDb(startListening);
