import { APIGatewayProxyEvent } from "aws-lambda";
import { Key } from "readline";
import { parseUserId } from "../auth/utils";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization ? authorization.split(' ') : "";
  const jwtToken = split[1];
  return parseUserId(jwtToken);
}

/**
 * Get limit parameter
 * @param event an event from API Gateway
 *
 * @returns limit query string
 */
 export function parseLimitKey(event: APIGatewayProxyEvent): number {
	const params = event.queryStringParameters || {};
	const check = params.limit || false;
	const Limit = check ? parseInt(params.limit) > 20 ? 20 : parseInt(params.limit) : 3
	return Limit
}

/**
 * Get next key parameter
 * @param event an event from API Gateway
 *
 * @returns next key query string
 */
 export function parseNextKey(event: APIGatewayProxyEvent): Key {
	const params = event.queryStringParameters || {};
	const nextKey = decodeURIComponent(params.next) == "undefined" ? undefined : decodeURIComponent(params.next);
	return nextKey == undefined ? undefined : JSON.parse(nextKey) as Key
}

/**
 * Get sort key parameter
 * @param event an event from API Gateway
 *
 * @returns sort query string
 */
 export function parseSortKey(event: APIGatewayProxyEvent): string {
	const params = event.queryStringParameters || {};
	const sort = params.sort == "dueDate" ? "dueDate" : "created";
	return sort;
}