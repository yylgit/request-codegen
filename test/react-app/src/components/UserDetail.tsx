import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRequestQuery, useRequestMutation } from '../generated/request'
import type { User, UpdateUserInput } from '../generated/models'

export default function UserDetail() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string>('1')

  const {
    data: user,
    error,
    isLoading,
  } = useRequestQuery<'GET/api/users/{id}', User>(
    'GET/api/users/{id}',
    { path: { id: selectedId } },
  )

  const updateUser = useRequestMutation('PATCH/api/users/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'request',
          'GET/api/users/{id}',
          { path: { id: selectedId } },
        ],
      })
      queryClient.invalidateQueries({ queryKey: ['request', 'GET/api/users'] })
      alert('User updated!')
    },
  })

  const handleUpdate = () => {
    if (!user) return
    updateUser.mutate({
      path: { id: selectedId },
      body: { name: `${user.name} (edited)` } satisfies UpdateUserInput,
    })
  }

  return (
    <section>
      <h2>User Detail</h2>
      <label>
        User ID:
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="1">1 - Alice</option>
          <option value="2">2 - Bob</option>
          <option value="3">3 - Carol</option>
        </select>
      </label>

      {isLoading && <div className="loading">Loading user...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      {user && (
        <div className="card">
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>Status:</strong> {user.status}
          </p>
          <p>
            <strong>Created:</strong>{' '}
            {new Date(user.createdAt).toLocaleString()}
          </p>
          <button onClick={handleUpdate} disabled={updateUser.isPending}>
            {updateUser.isPending ? 'Updating...' : 'Append "(edited)" to Name'}
          </button>
        </div>
      )}
    </section>
  )
}
