import { SqlDatabase } from "langchain/sql_db";
import { Ollama } from "@langchain/ollama";
import { DataSource } from "typeorm";
import { createSqlQueryChain, SQL_POSTGRES_PROMPT, SQL_PROMPTS_MAP } from "langchain/chains/sql_db";
import { PromptTemplate } from "@langchain/core/prompts";

const datasource = new DataSource({
	type: "postgres",
	username: "postgres",
	password: "password",
	host: "localhost",
	port: 5444,
	database: "development"
});
const db = await SqlDatabase.fromDataSourceParams({
	appDataSource: datasource,
});
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { QuerySqlTool } from "langchain/tools/sql";

const llm = new ChatOllama({
	// model: "llama3",
	temperature: 0,
	maxRetries: 2,
	// model: "pxlksr/defog_sqlcoder-7b-2:Q4_K",
	model: "pxlksr/defog_sqlcoder-7b-2:Q4_K_M"
});
// const llm = new Ollama({
// 	baseUrl: "http://localhost:11434",
// 	temperature: 0,
// 	// model: "llama2:latest",
// 	// model: "llama2:13b",
// 	// model: "mixtral",
// 	 model: "pxlksr/defog_sqlcoder-7b-2:Q4_K",
// 	// model: "pxlksr/defog_sqlcoder-7b-2:Q4_K_M"
// 	//model: "sqlcoder:15b", 
//
// });


// read user prompt
const userPrompt = Bun.argv[0]

const businessDomainContext = `
location_span table contains location history for employees, a single row contains employee's location log for a duration of time in a certain location.
subject_id is ID of the employee, when we refer to employees we only use their ID.
Employee location history is stored as a series of location_span rows, each row represents a single visit to a zone, "start" column represents the time at which employee entered the location, "end" column represents time at which employee exited the location.
Productivity of employee is proportional to the total duration of their stay in any of the locations. The more time an employee has spent in any of the locations, higher their productivity. 	
`



// old prompts
const oldprompt = PromptTemplate.fromTemplate(`Based on the provided SQL table schema below and context, write a SQL query that would answer the user's question. The response must be a valid postgres SQL query. 
------------
CONTEXT: ${businessDomainContext}
------------
SCHEMA: {table_info}
------------
QUESTION: {input}
------------
SQL QUERY:`);

const finalResponsePrompt =
	PromptTemplate.fromTemplate(`You are a worker coordinator. Based on the table schema below and context, question, SQL query, and SQL response, write a natural language response in Croatian language. Use only location_span table:,
------------
CONTEXT: ${businessDomainContext}
------------
SCHEMA: {table_info}
------------
QUESTION: {input}
------------
SQL QUERY: {query}
------------
SQL RESPONSE: {response}
------------
NATURAL LANGUAGE RESPONSE:`);












// export const defogprompt = new PromptTemplate({
//   template: `Based on the provided SQL table schema below and context, write a SQL query that would answer the user's question. The response must be a valid postgres SQL query
//
// Use the following format:
// Context: "business context here"
// Question: "Question here"
// SQLQuery: "SQL Query to run"
// SQLResult: "Result of the SQLQuery"
// Answer: "Final answer here"
//
// Only use the following tables:
// {table_info}
//
// Question: {input}`,
//   inputVariables: ["dialect", "table_info", "input", "top_k"],
// });
// export const myprompt = new PromptTemplate({
//   template: `You are a PostgreSQL expert. Given an input question, first create a syntactically correct PostgreSQL query to run, then look at the results of the query and return the answer to the input question.
// Unless the user specifies in the question a specific number of examples to obtain, query for at most {top_k} results using the LIMIT clause as per PostgreSQL. You can order the results to return the most informative data in the database.
// Never query for all columns from a table. You must query only the columns that are needed to answer the question. Wrap each column name in double quotes (") to denote them as delimited identifiers.
// Pay attention to use only the column names you can see in the tables below. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table.
//
//
// Use the following format:
// Context: "business context here"
// Question: "Question here"
// SQLQuery: "SQL Query to run"
// SQLResult: "Result of the SQLQuery"
// Answer: "Final answer here"
//
// Only use the following tables:
// {table_info}
//
// Question: {input}`,
//   inputVariables: ["dialect", "table_info", "input", "top_k"],
// });
//

const executeQuery = new QuerySqlTool(db);

// const writeQuery = await createSqlQueryChain({
// 	llm,
// 	db,
// 	dialect: "postgres",
// 	// prompt: myprompt,
// 	prompt:oldprompt 
// })

const sqlQueryChain = RunnableSequence.from([
	{
		schema: async () => db.getTableInfo(),
		question: (input: { question: string }) => input.question,
	},
	prompt,

	llm.bind({ stop: ["\nSQLResult:"] }),
	new StringOutputParser(),
]);

// const question = prompt("prompt:")
// const sqlQuery = await chain.invoke({
// 	question, 	
// });


// const sqlResponse = await db.run(sqlQuery)
// console.log("SQL_PROMPTS_MAP", SQL_PROMPTS_MAP["postgres"].toJSON())
//
// const answerPrompt =
//   PromptTemplate.fromTemplate(`You are a worker coordinator. Based on the table schema below and context, question, SQL query, and SQL response, write a natural language response in Croatian language. 
// Context: ${businessDomainContext} 
// Question: {question}
// SQL Query: {query}
// SQL Result: {result}
// Answer: `);

const answerChain = finalResponsePrompt.pipe(llm).pipe(new StringOutputParser())
const chain = RunnableSequence.from([
	RunnablePassthrough
		.assign({ query: writeQuery })
		.assign({
			result: (input: { query: string }) => {
				// console.log('query', input.query)
				return executeQuery.invoke(input.query)
			}
		}),

	answerChain
])

// const finalResponse = await chain.streamLog({question: userPrompt})
chain.streamLog({ question: userPrompt })


// console.log("final response: ", finalResponse)


