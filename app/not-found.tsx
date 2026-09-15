import { EmptyState } from "../components/ui/EmptyState";

export default function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <EmptyState>
        There&apos;s nothing here. <a href="/dashboard">Back to dashboard</a>
      </EmptyState>
    </div>
  );
}
