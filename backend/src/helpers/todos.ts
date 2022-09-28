import { createTodo, getTodos, deleteTodo, updateTodo, generateUrl } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
// import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
// import { createLogger } from '../utils/logger'
// import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic

export function getUserTodos(userId: string) {
	return new Promise(async (resolve, reject) => {
		const todo = await getTodos(userId);
		if(todo.status == "ok") resolve(todo.data)
		reject(todo.data);
	});
}

export function createUserTodo(newTodo: CreateTodoRequest, userId: string): Promise <{}> {
	return new Promise(async (resolve, reject) => {
		const todo = await createTodo(newTodo, userId);
		if(todo.status == "ok") resolve(todo.data)
		reject(todo.data);
	});
}

export function deleteUserTodo(todoId: string, userId: string):Promise <{}> {
	return new Promise(async (resolve, reject) => {
		const todo = await deleteTodo(todoId, userId);
		if(todo.status == "ok") resolve(todo.data)
		reject(todo.data);
	});
}

export function updateUserTodo(updatedTodo: UpdateTodoRequest, todoId: string, userId: string):Promise <{}> {
	return new Promise(async (resolve, reject) => {
		const todo = await updateTodo(updatedTodo, todoId, userId);
		if(todo.status == "ok") resolve(todo.data)
		reject(todo.data);
	});
}

export function createAttachmentPresignedUrl(todoId: string, userId: string):Promise <{}> {
	return new Promise(async (resolve, reject) => {
		const todo = await generateUrl(todoId, userId);
		if(todo.status == "ok") resolve(todo.data)
		reject(todo.data);
	});
}

