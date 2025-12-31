import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors';
import { TranslationController } from "./TranslationController";

const app = new Elysia()
    .use(cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }))
    .use(TranslationController)
    .get("/", () => "Hello Language Enthusiast!")
    .listen(3000);

console.log(
  `IdiomasApp is running at ${app.server?.hostname}:${app.server?.port}`
);