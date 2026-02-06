import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors';
import { TranslationController } from "./TranslationController";
import { supportedLanguages } from "./schemas/languages";
import { AuthController } from "./AuthController";
import { AuthMiddleware } from "./middleware/auth";

const SupportedLanguages = new Elysia()
    .get("/languages", () => {
        return {
            languages: Object.values(supportedLanguages)
        };
    });

const app = new Elysia()
    .use(cors({
      origin: false,
      methods: [],
    }))
    .get("/", () => "Hello Language Enthusiast!")
    //.use(AuthController)
    //.use(AuthMiddleware)
    .use(TranslationController)
    .use(SupportedLanguages)
    .listen({
      port: Number(process.env.PORT) || 3000,
      hostname: "0.0.0.0"
    });

console.log(
  `IdiomasApp is running at ${app.server?.hostname}:${app.server?.port}`
);
