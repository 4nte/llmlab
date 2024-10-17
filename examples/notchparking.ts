import * as fs from "node:fs/promises";
import { ChatOllama } from "@langchain/ollama";
import sharp from "sharp"
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
// const imageData = await fs.readFile("../data/parkingcameracut.png");

const imageData = await fs.readFile("../data/parkingcamera2.png");
const croppedImage = await sharp(imageData)
  .resize(1200, 1080, {
    fit: sharp.fit.contain,
    withoutReduction: true
  })
  .png()
  .toBuffer()
  // .toFile('../data/output.png', (err, info) => { console.log({err, info}) });


// process.exit()
const visionModel = new ChatOllama({
  temperature: 0,
  model: "llava:13b",
});


const image = croppedImage.toString("base64")
const visionMessages = new HumanMessage({
  content: [
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,{image}`,
      },
    },
    {
      type: "text",
      text: "Count cars and people in the image. respond with a valid json in the following format: {cars: number, people: number } ",
    },
  ],
});

const visionPrompt = ChatPromptTemplate.fromMessages([visionMessages]) 


const myChain = RunnableSequence.from([
  visionPrompt,
  visionModel,
  new JsonOutputParser<{cars: number, people: number}>()
])

const res = await myChain.invoke({image: image})
console.log('notch parking state:', res)
