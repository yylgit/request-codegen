import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardSummary from './components/DashboardSummary'
import UserList from './components/UserList'
import UserForm from './components/UserForm'
import UserDetail from './components/UserDetail'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <h1>request-codegen Test App</h1>
        <DashboardSummary />
        <hr />
        <UserForm />
        <hr />
        <UserList />
        <hr />
        <UserDetail />
      </div>
    </QueryClientProvider>
  )
}
