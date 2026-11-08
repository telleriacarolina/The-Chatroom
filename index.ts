import 'dotenv/config';
import { generateText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'AI_GATEWAY_API_KEY is not set. Add it to .env.local before running this example.'
    );
  }

  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const { text } = await generateText({
    model: gateway('moonshotai/kimi-k3'),
    prompt:
      'Invent a brand-new holiday and describe its traditions, foods, music, and how people celebrate it.',
  });

  console.log(text);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
