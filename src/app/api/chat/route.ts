import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful pet poison control expert. Aid concerned pet owners with their questions.",
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}