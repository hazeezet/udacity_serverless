import { createTodo, getTodos, deleteTodo, updateTodo, generateUrl } from './todosAcess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { Key } from 'readline';

// TODO: Implement businessLogic

interface params {
	limit: number,
	nextKey: Key,
	sort: string
}

export function getUserTodos(userId: string, params: params) {
	return new Promise(async (resolve, reject) => {
		const todo = await getTodos(userId, params);
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

