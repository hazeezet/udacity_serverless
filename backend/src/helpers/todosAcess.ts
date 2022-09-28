// import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import dateFormat from 'dateformat';
import { createLogger } from '../utils/logger';
import { v4 as uuid}  from 'uuid';
import { TodoUpdate } from '../models/TodoUpdate';

// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const todoTable = process.env.TODOS_TABLE;
const response = {
	status: "failed",
	message: "",
	data: {}
}

export async function getTodos(userId: string) {
	try {
		const DB = new DocumentClient();
		const result = await DB.query({
			TableName: todoTable,
			KeyConditionExpression: "userId = :userId",
			ExpressionAttributeValues: {":userId":`${userId}`}
		}).promise();
		
		const todos = result.Items;
		response.data = todos
		response.status = "ok"
		return response;
	} 
	catch (error) {
		logger.log('error', error);
		return response;
	}
	
}

export async function createTodo(todo: {}, userId: string) {
	try {
		const todoId = uuid();
		const date = new Date()
		const now = dateFormat(date, 'yyyy-mm-dd') as string;
		const new_todo = {
			todoId,
			userId,
			createdAt: now,
			done: false,
			attachmentUrl: "",
			...todo
		}
		const DB = new DocumentClient();
		await DB.put({
			TableName: todoTable,
			Item: new_todo
		}).promise();
		
		response.data = new_todo
		response.status = "ok"
		return response;
	} 
	catch (error) {
		logger.log('error', error);
		return response;
	}
	
}

export async function deleteTodo(todoId: string, userId: string) {
	try {
		const DB = new DocumentClient();
		await DB.delete({
			TableName: todoTable,
			Key: {
				todoId,
				userId
			}
		}).promise();
		
		response.status = "ok"
		return response;
	} 
	catch (error) {
		logger.log('error', error);
		return response;
	}
	
}

export async function updateTodo(todo: TodoUpdate, todoId: string, userId: string) {
	try {
		const DB = new DocumentClient();
		await DB.update({
			TableName: "todoTable",
			UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
			ExpressionAttributeValues: {":name": `${todo.name}`, ":dueDate": `${todo.dueDate}`, ":done": `${todo.done}`},
			ExpressionAttributeNames: {
				"#name": "name"
			},
			Key: {
				todoId,
				userId
			}
		}).promise();
		
		response.status = "ok"
		return response;
	} 
	catch (error) {
		logger.log('error', error);
		return response;
	}
	
}

