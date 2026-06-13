import { useQueryClient } from '@tanstack/react-query'
import { useRequestQuery, useRequestMutation } from '../generated/request'
import type { UsersResponse } from '../generated/models'

export default function UserList() {
  const queryClient = useQueryClient()

  const { data, error, isLoading } = useRequestQuery<
    'GET/api/users',
    UsersResponse
  >('GET/api/users', {})

  const deleteUser = useRequestMutation('DELETE/api/users/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', 'GET/api/users'] })
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Delete this user?')) {
      deleteUser.mutate({ path: { id } })
    }
  }

  if (isLoading) return <div className="loading">Loading users...</div>
  if (error) return <div className="error">Error: {error.message}</div>
  if (!data) return null

  return (
    <section>
      <h2>Users ({data.users.length})</h2>
      {deleteUser.isError && (
        <div className="error">Delete failed: {deleteUser.error.message}</div>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>
                <button
                  className="danger"
                  onClick={() => handleDelete(user.id)}
                  disabled={deleteUser.isPending}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
