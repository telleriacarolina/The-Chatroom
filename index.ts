import { generateText } from "ai";

async function main() {
  const result = await generateText({
    model: "moonshotai/kimi-k3",
    prompt:
      "Invent a new holiday and describe its traditions in a vivid, cheerful paragraph.",
  });

  console.log(result.text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
