import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors';
import { TranslationController } from "./TranslationController";
import { supportedLanguages } from "./schemas/languages";

const SupportedLanguages = new Elysia()
    .get("/languages", () => {
        return {
            languages: Object.values(supportedLanguages)
        };
    });

const app = new Elysia()
    .use(cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"]
    }))
    .use(TranslationController)
    .use(SupportedLanguages)
    .get("/", () => "Hello Language Enthusiast!")
    .listen({
      port: Number(process.env.PORT) || 3000,
      hostname: "0.0.0.0"
    });

console.log(
  `IdiomasApp is running at ${app.server?.hostname}:${app.server?.port}`
);
