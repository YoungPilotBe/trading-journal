import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/trade_onboarding/add_template')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/trade_onboarding/add_template"!</div>
}
