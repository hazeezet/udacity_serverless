import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import dateFormat from 'dateformat';
import { createLogger } from '../utils/logger';
import { v4 as uuid}  from 'uuid';
import { TodoUpdate } from '../models/TodoUpdate';
import { Key } from 'readline';


const logger = createLogger('TodosAccess');

// TODO: Implement the dataLayer logic

const S3 = new AWS.S3({
	signatureVersion: "v4"
})
const todoTable = process.env.TODOS_TABLE;
const createdIndex = process.env.TODOS_CREATED_INDEX;
const dueDateIndex = process.env.TODOS_DUE_INDEX;
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExp = process.env.SIGNED_URL_EXPIRATION;

const response = {
	status: "failed",
	message: "",
	data: {}
}

interface params {
	limit: number,
	nextKey: Key,
	sort: string
}

export async function getTodos(userId: string, params: params) {
	try {
		const newLimit = params.limit + 1; //To avoid dynamodb bringing LastEvaluatedKey when no more result
		const DB = new DocumentClient();
		
		const result = await DB.query({
			TableName: todoTable,
			IndexName: params.sort == 'dueDate' ? dueDateIndex : createdIndex,
			KeyConditionExpression: "userId = :userId",
			ExpressionAttributeValues: {":userId":`${userId}`},
			ScanIndexForward: params.sort == 'dueDate' ? true : false,
			Limit: newLimit,
			ExclusiveStartKey:  params.nextKey
		}).promise();
		
		if(result.Count == newLimit) result.Items.pop(); //because we added 1 to the limit, we should remove the excess

		let next: {};
		if(params.sort == "created"){
			next = { //get the next key for pagination
				createdAt: result.Items.length > 0 ? result.Items[result.Items.length - 1].createdAt : undefined,
				todoId: result.Items.length > 0 ? result.Items[result.Items.length - 1].todoId : undefined,
				userId: result.Items.length > 0 ? result.Items[result.Items.length - 1].userId : undefined
			}
		}
		else{
			next = { //get the next key for pagination
				dueDate: result.Items.length > 0 ? result.Items[result.Items.length - 1].dueDate : undefined,
				todoId: result.Items.length > 0 ? result.Items[result.Items.length - 1].todoId : undefined,
				userId: result.Items.length > 0 ? result.Items[result.Items.length - 1].userId : undefined,
			}
		}
		
		const newNextKey = result.Count == newLimit ? JSON.stringify(next) as string : undefined;
		const todos = {
			items: result.Items,
			nextKey: encodeURIComponent(newNextKey)
		}
		response.data = todos
		response.status = "ok";
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
		const now = dateFormat(date, 'yyyy-mm-dd HH:MM:ss') as string;
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
		var params = {  Bucket: bucketName, Key: todoId };

		S3.deleteObject(params, function(err) {
			if (err) logger.log("error", err.stack);
		});
		
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

		const DB = new DocumentClient();
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

	function getUploadUrl(todoId: string){
		return S3.getSignedUrl('putObject',{
			Bucket: bucketName,
			Key: todoId,
			Expires: parseInt(urlExp)
		})
	}
}

