import { Elysia } from "elysia";
import { TranslationController } from "./TranslationController";

const app = new Elysia()
    .use(TranslationController)
    .get("/", () => "Hello Elysia")
    .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
