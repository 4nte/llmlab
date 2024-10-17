import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";

const model = new ChatOllama({
	temperature: 0,
	maxRetries: 2,
	model: "llama3.2",
});

const joke = z.object({
  setup: z.string().describe("The setup of the joke"),
  punchline: z.string().describe("The punchline to the joke"),
  rating: z.number().optional().describe("How funny the joke is, from 1 to 10"),
});




const structuredLlm = model.withStructuredOutput(joke);

const res = await structuredLlm.invoke("Tell me a joke about cats");
console.log('res', res)
