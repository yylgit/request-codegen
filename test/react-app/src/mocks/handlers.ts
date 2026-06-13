import { http, HttpResponse, delay } from 'msw'

// --- Mock data ---

const dashboardSummary = {
  heading: 'Dashboard Overview',
  description: 'Key metrics for your team',
  updatedAt: new Date().toISOString(),
  metrics: [
    { label: 'Total Users', value: '3', helper: 'Active accounts' },
    { label: 'Active Sessions', value: '12', helper: 'Last 24 hours' },
    { label: 'Storage Used', value: '2.4 GB', helper: 'Of 10 GB limit' },
  ],
}

type MockUser = {
  id: string
  name: string
  email: string
  role: string
  status: 'ACTIVE' | 'INVITED' | 'DISABLED'
  createdAt: string
  updatedAt: string
}

const users: MockUser[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'ACTIVE',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-06-01T14:30:00Z',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'ACTIVE',
    createdAt: '2025-03-20T09:00:00Z',
    updatedAt: '2026-05-28T11:00:00Z',
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'carol@example.com',
    role: 'Viewer',
    status: 'INVITED',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
]

// --- Handlers ---

export const handlers = [
  // GET /api/dashboard/summary
  http.get('/api/dashboard/summary', async () => {
    await delay(300)
    return HttpResponse.json(dashboardSummary)
  }),

  // GET /api/users
  http.get('/api/users', async () => {
    await delay(400)
    return HttpResponse.json({ users })
  }),

  // GET /api/users/:id
  http.get('/api/users/:id', async ({ params }) => {
    await delay(200)
    const user = users.find((u) => u.id === params.id)
    if (!user) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(user)
  }),

  // POST /api/users
  http.post('/api/users', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as {
      name: string
      email: string
      role: string
      status: string
    }
    const newUser = {
      id: String(users.length + 1),
      ...body,
      status: body.status as 'ACTIVE' | 'INVITED' | 'DISABLED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    users.push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  // PATCH /api/users/:id
  http.patch('/api/users/:id', async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, unknown>
    const index = users.findIndex((u) => u.id === params.id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    users[index] = { ...users[index], ...body, updatedAt: new Date().toISOString() } as typeof users[number]
    return HttpResponse.json(users[index])
  }),

  // DELETE /api/users/:id
  http.delete('/api/users/:id', async ({ params }) => {
    await delay(200)
    const index = users.findIndex((u) => u.id === params.id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    users.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
