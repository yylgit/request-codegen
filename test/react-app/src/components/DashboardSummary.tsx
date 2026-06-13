import { useRequestQuery } from '../generated/request'
import type { DashboardSummary as DashboardSummaryType } from '../generated/models'

export default function DashboardSummary() {
  const { data, error, isLoading } = useRequestQuery<
    'GET/api/dashboard/summary',
    DashboardSummaryType
  >('GET/api/dashboard/summary', {})

  if (isLoading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="error">Error: {error.message}</div>
  if (!data) return null

  return (
    <section>
      <h2>{data.heading}</h2>
      <p>{data.description}</p>
      <p>
        <small>Last updated: {new Date(data.updatedAt).toLocaleString()}</small>
      </p>
      <div className="metrics">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <strong>{metric.label}</strong>
            <p>{metric.value}</p>
            <small>{metric.helper}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
