import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import dateFormat from 'dateformat';
import { createLogger } from '../utils/logger';
import { v4 as uuid}  from 'uuid';
import { TodoUpdate } from '../models/TodoUpdate';

// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const S3 = new AWS.S3({
	signatureVersion: "v4"
})
const todoTable = process.env.TODOS_TABLE;
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExp = process.env.SIGNED_URL_EXPIRATION;

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
			ExpressionAttributeValues: {":userId":`${userId}`},
			ScanIndexForward: false
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

