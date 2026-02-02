import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Circle, ListTodo, LogOut } from 'lucide-react'
import axios from 'axios'
import { useAuth } from './AuthContext'

function Dashboard() {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const { logout } = useAuth()

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:3001/todos')
      setTodos(response.data)
    } catch (error) {
      console.error("Error fetching todos", error)
    }
  }

  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newTodo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }

    try {
      await axios.post('http://localhost:3001/todos', newTodo)
      setTodos([...todos, newTodo])
      setInputValue('')
    } catch (error) {
      console.error("Error adding todo", error)
    }
  }

  const toggleTodo = async (id, completed) => {
    try {
      await axios.put(`http://localhost:3001/todos/${id}`, { completed: !completed })
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.error("Error toggling todo", error)
    }
  }

  const removeTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/todos/${id}`)
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error("Error removing todo", error)
    }
  }

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <ListTodo size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Minhas Tarefas
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {todos.length === 0 
                  ? 'Nenhuma tarefa por enquanto' 
                  : `${completedCount} de ${todos.length} tarefas concluídas`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={24} />
          </button>
        </header>

        {/* Input Form */}
        <form onSubmit={handleAddTodo} className="mb-8 relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Adicionar uma nova tarefa..."
            className="w-full bg-slate-800 border-2 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
          >
            <Plus size={24} />
          </button>
        </form>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
              <p>Sua lista está vazia. Adicione uma tarefa acima!</p>
            </div>
          )}

          {todos.map(todo => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                todo.completed 
                  ? 'bg-slate-800/50 border-slate-800 opacity-75' 
                  : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex-shrink-0 transition-colors ${
                  todo.completed ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'
                }`}
              >
                {todo.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>
              
              <span 
                className={`flex-grow font-medium truncate transition-all ${
                  todo.completed ? 'text-slate-500 line-through' : 'text-slate-200'
                }`}
              >
                {todo.text}
              </span>

              <button
                onClick={() => removeTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Remover tarefa"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
