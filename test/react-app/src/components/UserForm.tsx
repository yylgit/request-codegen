import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRequestMutation } from '../generated/request'
import type { UserFormInput, User } from '../generated/models'

const emptyForm: UserFormInput = {
  name: '',
  email: '',
  role: 'Viewer',
  status: 'INVITED',
}

export default function UserForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<UserFormInput>(emptyForm)

  const createUser = useRequestMutation<'POST/api/users', void>(
    'POST/api/users',
    {
      onSuccess: (newUser: User) => {
        queryClient.invalidateQueries({ queryKey: ['request', 'GET/api/users'] })
        setForm(emptyForm)
        alert(`Created user: ${newUser.name}`)
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser.mutate({ body: form })
  }

  return (
    <section>
      <h2>Create User</h2>
      {createUser.isError && (
        <div className="error">Create failed: {createUser.error.message}</div>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Role
          <input
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as UserFormInput['status'],
              })
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>
        <button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </section>
  )
}
