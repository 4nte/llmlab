
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import z from "zod"

const llm = new ChatOllama({
	temperature: 0,
	model: "llama2:13b",
});

// * 1. invoking llm directly
const response = await llm.invoke("how many days in a year?")
console.log('response:', response)


// * 2. Creating prompt template
const promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a joke about {topic}"
);
console.log(await promptTemplate.invoke({ topic: "cats" }));


// * 3. Creating chains


// ** ChatPromptTemplate** 
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
const chatpromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are IT support. Whenever someone asks you anything, tell them to turn on and off their pc."],
  ["user", "{issue}"],
]);

const chain = chatpromptTemplate.pipe(llm).pipe(new StringOutputParser())
const response = await chain.invoke({issue: "my microphone is not working"})
console.log('response', response)
//
//
//
//
//
//
//
//  model: "llama3.2",

const joke = z.object({
  setup: z.string().describe("The setup of the joke"),
  punchline: z.string().describe("The punchline to the joke"),
  rating: z.number().optional().describe("How funny the joke is, from 1 to 10"),
});
const structuredLlm = llm.withStructuredOutput(joke);

const res = await structuredLlm.invoke("Tell me a joke about cats ");
console.log('res', res)
