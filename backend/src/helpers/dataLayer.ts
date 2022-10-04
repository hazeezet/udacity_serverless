import {getDocumentClient} from "@shelf/aws-ddb-with-xray";
import dateFormat from 'dateformat';
import { createLogger } from '../utils/logger';
import { v4 as uuid}  from 'uuid';
import { TodoUpdate } from '../models/TodoUpdate';
import { Key } from 'readline';
import { getUploadUrl } from './fileManagement';

// TODO: Implement the dataLayer logic

const todoTable = process.env.TODOS_TABLE;
const createdIndex = process.env.TODOS_CREATED_INDEX;
const dueDateIndex = process.env.TODOS_DUE_INDEX;
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const region = process.env.REGION;

const DB = getDocumentClient({ //AWS XRAY TRACING
	ddbParams: {region: region, convertEmptyValues: true},
	ddbClientParams: {region: region},
});
const logger = createLogger('TodosAccess');

const response = {
	status: "failed",
	data: {},
	newLimit: 4
}

interface params {
	limit: number,
	nextKey: Key,
	sort: string
}

export async function getTodos(userId: string, params: params) {
	try {
		const newLimit = params.limit + 1; //To avoid dynamodb bringing LastEvaluatedKey when no more result
		
		const result = await DB.query({
			TableName: todoTable,
			IndexName: params.sort == 'dueDate' ? dueDateIndex : createdIndex,
			KeyConditionExpression: "userId = :userId",
			ExpressionAttributeValues: {":userId":`${userId}`},
			ScanIndexForward: params.sort == 'dueDate' ? true : false,
			Limit: newLimit,
			ExclusiveStartKey:  params.nextKey
		}).promise();
		
		return{
			status: "ok",
			data: result as any,
			newLimit
		}
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
		const now = dateFormat(date, 'yyyy-mm-dd HH:MM:ss') as string;
		const new_todo = {
			todoId,
			userId,
			createdAt: now,
			done: false,
			attachmentUrl: "",
			...todo
		}

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
		await DB.update({
			TableName: todoTable,
			UpdateExpression: "set #tit = :val, dueDate = :dueDate, done = :done",
			ExpressionAttributeValues: {":val": `${todo.name}`, ":dueDate": `${todo.dueDate}`, ":done": `${todo.done}`},
			ExpressionAttributeNames: {
				"#tit": "name"
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

export async function generateUrl(todoId: string, userId: string) {
	try {
		const uploadUrl = getUploadUrl(todoId);
		const imageUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`;

		await DB.update({
			TableName: todoTable,
			UpdateExpression: "set attachmentUrl = :url",
			ExpressionAttributeValues: {":url": `${imageUrl}`},
			Key: {
				todoId,
				userId
			}
		}).promise();
		
		response.data = uploadUrl
		response.status = "ok";
		return response;
	} 
	catch (error) {
		logger.log('error', error);
		return response;
	}
}

