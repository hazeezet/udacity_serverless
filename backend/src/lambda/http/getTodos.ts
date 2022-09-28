// import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

import { getUserTodos } from '../../helpers/todos';
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user✅
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
	try {
		const userId = getUserId(event);
		const todos = await getUserTodos(userId)

		return{
			statusCode: 200,
			body: JSON.stringify({
				items: todos
			})
		}
	}
	catch (error) {
		return{
			statusCode: 500,
			body: error
		}
	}
    
})

handler.use(
  cors({
    credentials: true
  })
)
