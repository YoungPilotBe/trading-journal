import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/dashboard/trade_templates/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/trade_templates"!</div>
}
