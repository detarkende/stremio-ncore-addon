import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_configured/_authenticated/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello torrents!</div>;
}
