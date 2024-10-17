import "pdf-parse";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";

const spotsieGatewayInstructions = new PDFLoader("../data/spotsie-gateway-instructions.pdf");
const docs = await spotsieGatewayInstructions.load()

// instantiate model for answering
const llm = new ChatOllama({
	model: "llama2:13b",
	temperature: 0,
});

// instantiate embedding model
import { OllamaEmbeddings } from "@langchain/ollama";
const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
});

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Split text into overlapping chunks 
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 100,
});
const splits = await textSplitter.splitDocuments(docs);

// this is what happens under the hood:
// const vector = await embeddings.embedQuery("Notch is a software company")
const vectorstore = await MemoryVectorStore.fromDocuments(
  splits,
  embeddings
);

const retriever = vectorstore.asRetriever();
// const retriever = MultiQueryRetriever.fromLLM({
//   llm:  llm,
//   retriever: vectorstore.asRetriever(),
// });

// example of retrieveing from the vector store
// const retrievedDocuments = await retriever.invoke("How to assemble gateway?")

// const content = retrievedDocuments
// console.log('page content of retrieved docs', content)


const systemTemplate = 
  `You are an assistant for question-answering tasks. 
  Use the following pieces of retrieved context to answer,
  the question. If you don't know the answer, say that you,
  don't know. no yapping. 
  {context}`

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["human", "{input}"],
]);

// "stuff” all of the input documents into the prompt. It will also handle formatting the docs as strings.
const questionAnswerChain = await createStuffDocumentsChain({llm, prompt})

const ragChain = await createRetrievalChain({
  retriever,
  combineDocsChain: questionAnswerChain
})


// example questions
// const results = await ragChain.invoke({
  // input: "How to assemble spotsie gateway?",
  // input: "what tools do I need to assemble spotsie gateway?",
  // input: "How to supply power to spotsie gateway?"
  // input: "What are risks when installing spotsie gateway?"
  // input: "what tools do I need to assemble spotsie gateway?",
// })

const question = process.argv[2]
const res = await ragChain.invoke({input: question})
console.log("answer", res.answer)

