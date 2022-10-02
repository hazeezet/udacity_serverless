export interface Content {
	todoId: string
	createdAt: string
	name: string
	dueDate: string
	done: boolean
	attachmentUrl?: string
}

export interface Todo {
	items: Content[]
	nextKey: string
}
