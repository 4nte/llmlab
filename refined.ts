
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";







// questions yielding good responses
const goodquestions = [
	"who are the top 8 most productive employees and why?"
]

 const question = Bun.argv[2]

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

const llm = new ChatOllama({
	temperature: 0,
	model: "pxlksr/defog_sqlcoder-7b-2:Q4_K_M",
	// verbose: true

});

const context = `
location_span table contains location history for employees, a single row contains employee's location log for a duration of time in a certain location.
subject_id is ID of the employee, when we refer to employees we only use their ID.
Employee location history is stored as a series of location_span rows, each row represents a single visit to a zone, "start" column represents the time at which employee entered the location, "end" column represents time at which employee exited the location.
Productivity of employee is proportional to the total duration of their stay in any of the locations. The more time an employee has spent in any of the locations, higher their productivity. 	
`

// const questions = [
//
// 	"Where was employee id 1 on 01.01.2024 between 16:00 and 18:00",
//   "Tko su tri najproduktivnija zaposlenika?",
//   "Tko su tri najproduktivnija zaposlenika, i koliko vremena je svatko od njih proveo u zonama?",
// 	"Who are the 3 most productive employees?",
// 	"Who are the 3 least productive employees?",
// 	"Where was employee id 1 at 01.01 at 12pm",
// 	"Find 3 least productive employees and explain why they are least productive.",
// 	"How productive was employee with id 1 during mondays?",
// 	"How productive was employee with id 1 during tuesdays?",
// 	"What locatons are most visited on fridays?",
// 	"what is the single most visited location on monday?",
// 	"what was the longest stay in a location and by what employee?"
// ]

const prompt =
		PromptTemplate.fromTemplate(`Based on the provided SQL table schema below and context, write a SQL query that would answer the user's question. The response must be a valid postgres SQL query. 
------------
CONTEXT: ${context}
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY:`);
	/**
	 * Create a new RunnableSequence where we pipe the output from `db.getTableInfo()`
	 * and the users question, into the prompt template, and then into the llm.
	 * We're also applying a stop condition to the llm, so that it stops when it
	 * sees the `\nSQLResult:` token.
	 */
	const sqlQueryChain = RunnableSequence.from([
		{
			schema: async () => db.getTableInfo(),
			question: (input: { question: string }) => input.question,
		},
		prompt,

		llm.bind({ stop: ["\nSQLResult:"] }),
		new StringOutputParser(),
	]);
	// const query = await sqlQueryChain.invoke({
	// 	question,
	// });
	// console.log({ query });

	/**
	 * Create the final prompt template which is tasked with getting the natural language response.
	 */
const finalResponsePrompt = PromptTemplate.fromTemplate(`You are a worker coordinator. Based on the table schema below and context, question, SQL query, and SQL response, write a natural language response in Croatian language:,
------------
CONTEXT: ${context}
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY: {query}
------------
SQL RESPONSE: {response}
------------
NATURAL LANGUAGE RESPONSE:`);
/**
 * Create a new RunnableSequence where we pipe the output from the previous chain, the users question,
 * and the SQL query, into the prompt template, and then into the llm.
 * Using the result from the `sqlQueryChain` we can run the SQL query via `db.run(input.query)`.
 */
const finalChain = RunnableSequence.from([
	{
		question: (input) => input.question,
		query: sqlQueryChain,
	},
	{
		schema: async () => db.getTableInfo(),
		question: (input) => input.question,
		query: (input) => input.query,
		response: (input) => db.run(input.query),
	},
	finalResponsePrompt,
	llm,
	new StringOutputParser(),
]);



const finalResponse = await finalChain.invoke({
	question,
});

console.log('question', question)
console.log('final response', finalResponse)




