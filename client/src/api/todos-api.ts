import { apiEndpoint } from '../config';
import { Content, Todo } from '../types/Todo';
import { CreateTodoRequest } from '../types/CreateTodoRequest';
import Axios from 'axios';
import jimp from "jimp";
import { UpdateTodoRequest } from '../types/UpdateTodoRequest';

export async function getTodos(idToken: string, limit?: string, nextKey?: string, sort?: string): Promise<Todo> {
  console.log('Fetching todos')

  const response = await Axios({
	url: `${apiEndpoint}/todos`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
	params: {
		limit: limit,
		next: nextKey,
		sort: sort == '' ? undefined : sort
	}
  })
  console.log('Todos:', response.data)
  return response.data
}

export async function createTodo(
  idToken: string,
  newTodo: CreateTodoRequest
): Promise<Content> {
  const response = await Axios.post(`${apiEndpoint}/todos`,  JSON.stringify(newTodo), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.item
}

export async function patchTodo(
  idToken: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/todos/${todoId}`, JSON.stringify(updatedTodo), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function deleteTodo(
  idToken: string,
  todoId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/todos/${todoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function getUploadUrl(
  idToken: string,
  todoId: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/todos/${todoId}/attachment`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.uploadUrl
}

export async function uploadFile(uploadUrl: string, file: Buffer): Promise<void> {

	const image = await jimp.read(file);
	image.resize(50,50);

	const buff = await image.getBufferAsync(jimp.MIME_PNG)
	console.log(buff)

	await Axios.put(uploadUrl, buff)
}
