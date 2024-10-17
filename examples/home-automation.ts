import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import z from "zod"
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as API from "../api";

const model = new ChatOllama({
  temperature: 0,
  model: "llama3.2"
})			

const newTemperatureTool = new DynamicStructuredTool({
  name: "getTemperature",
  description: "gets the current temperature in celsius for a given location",
  schema: z.object({
    location: z.string().describe("Room such as bedroom, living room, garage"),
  }),
  func: (input) => API.getTemperature(input.location),
});

const modelWithTools = model.bindTools([newTemperatureTool])
const summary = ChatPromptTemplate.fromTemplate(`You are a home assistant, given the command and command result, respond with a summary: 
------------
COMMAND: {command}
------------
COMMAND RESULT: {command_result}
------------
SUMMARY:`)
const finalChain = RunnableSequence.from([
  {
    command: (input) => input, 
    tool: modelWithTools,
  },
  RunnableLambda.from(async (input: {command: string, tool: AIMessage} ) => { 
    if (!input.tool.tool_calls) {
      throw Error("I don't know what tool to use")
    }
    const tool = input.tool.tool_calls[0]
    if (tool.name === newTemperatureTool.name) {
      const temp = await newTemperatureTool.invoke(tool.args as any)
      return {command: input.command, command_result: temp}
    }
    }
  ),
  summary,
  model, 
  new StringOutputParser()
])

const response = await finalChain.invoke(process.argv[2])
console.log('home assistant response:', response)

 




