import { createTodo, getTodos, deleteTodo, updateTodo, generateUrl } from './todosAcess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { Key } from 'readline';
import { deleteBucket } from './attachment';

// TODO: Implement businessLogic

interface params {
	limit: number,
	nextKey: Key,
	sort: string
}

export function getUserTodos(userId: string, params: params) {
	return new Promise(async (resolve, reject) => {
		const todo = await getTodos(userId, params);

		if(todo.status !== "ok") reject(todo.data);

		if(todo.data.Count == todo.newLimit) todo.data.Items.pop(); //because we added 1 to the limit, we should remove the excess

		let next: {};
		if(params.sort == "created"){
			next = { //get the next key for pagination
				createdAt: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].createdAt : undefined,
				todoId: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].todoId : undefined,
				userId: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].userId : undefined
			}
		}
		else{
			next = { //get the next key for pagination
				dueDate: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].dueDate : undefined,
				todoId: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].todoId : undefined,
				userId: todo.data.Items.length > 0 ? todo.data.Items[todo.data.Items.length - 1].userId : undefined,
			}
		}
		
		const newNextKey = todo.data.Count == todo.newLimit ? JSON.stringify(next) as string : undefined;
		const todos = {
			items: todo.data.Items,
			nextKey: encodeURIComponent(newNextKey)
		}
		
		resolve(todos);
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
		if(todo.status != "ok") reject(todo.data);
		deleteBucket(todoId);
		resolve(todo.data);
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

