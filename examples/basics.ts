
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new ChatOllama({
	temperature: 0,
	maxRetries: 2,
	model: "llama2:13b",
});

const response = await llm.invoke("how many days in a year?")
console.log('response:', response)



// String PromptTemplate - Formats a single string 
const promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a joke about {topic}"
);
await promptTemplate.invoke({ topic: "cats" });



// ChatPromptTemplate 
//
import { ChatPromptTemplate } from "@langchain/core/prompts";
const ChatpromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["user", "Tell me a joke about {topic}"],
]);

await promptTemplate.invoke({ topic: "cats" });
