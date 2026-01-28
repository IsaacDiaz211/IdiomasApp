import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { spawn } from "node:child_process";

const askChoice = async (question: string, options: string[], fallback: string) => {
  while (true) {
    const answer = (await questionPrompt(`${question} (${options.join("/")}) [${fallback}]: `)).toLowerCase();
    const value = answer || fallback;
    if (options.includes(value)) return value;
    stdout.write(`Invalid choice. Use: ${options.join(", ")}\n`);
  }
};

const questionPrompt = async (question: string) => {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
};

const askEnv = async (name: string, required = true) => {
  const current = process.env[name];
  const suffix = current ? " (press Enter to keep current)" : "";
  while (true) {
    const value = (await questionPrompt(`${name}${suffix}: `)).trim();
    const resolved = value || current || "";
    if (!required || resolved.length > 0) return resolved;
    stdout.write(`${name} is required.\n`);
  }
};

const run = async () => {
  const target = await askChoice("Test target", ["local", "railway"], "local");
  const provider = await askChoice("Provider", ["openai", "mistral"], "openai");

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    TEST_TARGET: target,
    TEST_PROVIDER: provider
  };

  if (provider === "openai") {
    env.AI_KEY = await askEnv("AI_KEY");
    env.AI_BASE_URL = await askEnv("AI_BASE_URL");
    env.AI_MODEL = await askEnv("AI_MODEL");
  } else {
    env.MISTRAL_API_KEY = await askEnv("MISTRAL_API_KEY");
  }

  const testFile = `./tests/openai.providers.${target}.test.ts`;
  const child = spawn("bun", ["test", testFile], { stdio: "inherit", env });
  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
};

run().catch((error) => {
  console.error("Failed to run tests:", error);
  process.exit(1);
});
