import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Content } from '../types/Todo'

interface TodosProps {
	auth: Auth
	history: History
}

interface TodosState {
	todos: Content[]
	newTodoName: string
	dueDate: string
	sort: string,
	creating: boolean
	currentPage: string
	todoPerPage: string
	nextKey: string
	loadingTodos: boolean
	loadingNextTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
	state: TodosState = {
		todos: [],
		newTodoName: '',
		dueDate: '',
		sort: "",
		creating: false,
		nextKey: '',
		currentPage: '1',
		todoPerPage: "3",
		loadingNextTodos: false,
		loadingTodos: true
	}

	handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ newTodoName: event.target.value })
	}

	handleDueDate = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ dueDate: event.target.value })
		console.log(this.state.dueDate)
	}

	onEditButtonClick = (todoId: string) => {
		this.props.history.push(`/todos/${todoId}/edit`)
	}

	onTodoCreate = async () => {
		try {
			const date = new Date()
			const now = dateFormat(date, 'yyyy-mm-dd') as string

			if(now >= this.state.dueDate) return alert("Due date should be in the future");
			if(this.state.newTodoName == '') return alert("Todo name is empty");
			this.setState({
				creating: true
			})
			const newTodo = await createTodo(this.props.auth.getIdToken(), {
				name: this.state.newTodoName,
				dueDate: this.state.dueDate
			})
			this.setState({
				todos: [newTodo, ...this.state.todos],
				newTodoName: '',
				dueDate: '',
				creating: false
			})
		} catch {
			this.setState({
				creating: false
			})
			alert('Todo creation failed')
		}
	}

	onTodoDelete = async (todoId: string) => {
		try {
			await deleteTodo(this.props.auth.getIdToken(), todoId)
			this.setState({
				todos: this.state.todos.filter(todo => todo.todoId !== todoId)
			})
		} catch {
			alert('Todo deletion failed')
		}
	}

	onTodoCheck = async (pos: number) => {
		try {
			const todo = this.state.todos[pos]
			await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
				name: todo.name,
				dueDate: todo.dueDate,
				done: !todo.done
			})
			this.setState({
				todos: update(this.state.todos, {
				[pos]: { done: { $set: !todo.done } }
				})
			})
		} catch {
			alert('Todo check failed')
		}
	}

	onTodoPerPageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ todoPerPage: event.target.value });
	}

	handleTodoPerPage = async () => {
		const num = parseInt(this.state.todoPerPage);
		if(num>20) this.setState({todoPerPage: "20"});
		
	}

	onTodoPerPage = async () => {
		this.setState({
			loadingTodos: true
		})
		console.log(this.state.sort)
		try {
			const todos = await getTodos(this.props.auth.getIdToken(), this.state.todoPerPage, undefined, this.state.sort)
			this.setState({
				todos: todos.items,
				nextKey: todos.nextKey,
				loadingTodos: false
			})
		} catch (e) {
			this.setState({
				loadingTodos: false,
			})
			alert(`Failed to fetch todos: ${(e as Error).message}`)
		}
	}

	onNextPageTodo = async () => {
		try {
			this.setState({
				loadingNextTodos: true
			})
			const todos = await getTodos(this.props.auth.getIdToken(), this.state.todoPerPage, this.state.nextKey, this.state.sort)
			this.setState({
				todos: [...this.state.todos, ...todos.items],
				nextKey: todos.nextKey,
				loadingNextTodos: false,
			})
		} catch (e) {
			this.setState({
				loadingNextTodos: false,
			})
			alert(`Failed to fetch todos: ${(e as Error).message}`)
		}
	}

	onSort = async (event: React.ChangeEvent<HTMLSelectElement>) => {
		this.setState({
			loadingTodos: true
		})
		const sort = event.target.value == "" ? undefined : "dueDate"
		try {
			const todos = await getTodos(this.props.auth.getIdToken(), this.state.todoPerPage, undefined, sort)
			this.setState({
				todos: [...todos.items],
				nextKey: todos.nextKey,
				loadingTodos: false
			})
			this.setState({
				sort: event.target.value
			})
		} catch (e) {
			this.setState({
				loadingTodos: false,
			})
			alert(`Failed to fetch todos: ${(e as Error).message}`)
		}
	}

	async componentDidMount() {
		try {
			const todos = await getTodos(this.props.auth.getIdToken(), this.state.todoPerPage)
			this.setState({
				todos: todos.items,
				nextKey: todos.nextKey,
				loadingTodos: false
			})
		} catch (e) {
			this.setState({
				loadingTodos: false,
			})
			alert(`Failed to fetch todos: ${(e as Error).message}`)
		}
	}

	render() {
		return (
		<div>
			<div>
				<h4>Number of Todos per page</h4>
				<div style={{display: "flex"}}>
					<input placeholder='3' style={{width:"70px"}}
						value={this.state.todoPerPage}
						type="number"
						onChange={this.onTodoPerPageChange}
						onBlur={this.handleTodoPerPage}
					/>
					<button style={{marginLeft: "15px",cursor:"pointer"}}
						onClick={this.onTodoPerPage}
					>
						Go
					</button>
				</div>
			</div>


			<Header as="h1">TODOs</Header>

			{this.renderCreateTodoInput()}

			{this.renderTodos()}
		</div>
		)
	}

	renderCreateTodoInput() {
		return (
		<Grid.Row>
			<div style={{width:"100%",display:"flex", marginBottom:"20px"}}>
				<input
					style={{width:"100%", padding:"10px 0 10px 5px", marginRight:"10px"}}
					placeholder="Todo Name"
					onChange={this.handleNameChange}
					value={this.state.newTodoName}
				/>
				<input
					type='datetime-local'
					style={{width:"100%", padding:"10px 0 10px 5px"}}
					placeholder="Todo Name"
					onChange={this.handleDueDate}
					value={this.state.dueDate}
				/>
			</div>
			<button
				disabled={this.state.creating}
				style={{width:"40%", padding:"10px",backgroundColor:this.state.creating ? "#7ab1b1" : "teal", color:"white",border:"0px solid transparent",cursor:"pointer"}} 
				onClick={this.onTodoCreate}
			>
				Add Todo
			</button>
			<Grid.Column width={16}>
				<Divider />
			</Grid.Column>
		</Grid.Row>
		)
	}

	renderTodos() {
		if (this.state.loadingTodos) {
		return this.renderLoading()
		}

		return this.renderTodosList()
	}

	renderLoading() {
		return (
		<Grid.Row>
			<Loader indeterminate active inline="centered">
			Loading TODOs
			</Loader>
		</Grid.Row>
		)
	}

	renderTodosList() {
		return (
			<>
				<Grid padded>

					<div style={{width:"100%",display:"flex", flexDirection: "column", alignItems: "center"}}>
						<h4>sort by</h4>
						<select style={{marginLeft:"10px"}} onChange={this.onSort}>
							<option selected={this.state.sort == ''} value="">created</option>
							<option selected={this.state.sort != ''} value="dueDate">Due Date</option>
						</select>
					</div>

					<div style={{width:"100%"}}>
						<Divider />
					</div>

					{this.state.todos.map((todo, pos) => {
						return (
							<div key={pos}  style={{display: "unset", width:"100%"}}>
								<div style={{display:"flex", width:"100%", alignItems:"center"}}>
									{todo.attachmentUrl && (
										<img src={todo.attachmentUrl} />
									)}
									
									<div style={{margin: "0 10px 0 10px"}}>
										<Checkbox
											onChange={() => this.onTodoCheck(pos)}
											checked={todo.done}
										/>
									</div>
									
									<div style={{margin: "0 20px 0 10px", width:"100%"}}>
										{todo.name}
									</div>
									
									<div style={{margin: "0 10px 0 10px", width:"100%"}}>
										{todo.dueDate}
									</div>

									<Button
										icon
										color="blue"
										onClick={() => this.onEditButtonClick(todo.todoId)}
									>

										<Icon name="pencil" />
									</Button>

									<Button
										icon
										color="red"
										onClick={() => this.onTodoDelete(todo.todoId)}
									>
										<Icon name="delete" />
									</Button>
								</div>
								<div style={{width:"100%"}}>
									<Divider />
								</div>
								
							</div>
						)
					})}
				</Grid>
				
				{this.state.nextKey !== "undefined" && (
					<>
						{this.state.loadingNextTodos ? (
							this.renderLoading()
						)
						:
						(
							<div style={{display: "flex", width: "100%", justifyContent: "center"}}>
								<button style={{marginLeft: "15px"}} onClick={this.onNextPageTodo}>load more</button>
							</div>
						)}
						
					</>
					
				)}
				
			</>
		)
	}

}
