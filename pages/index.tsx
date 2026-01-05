import Block from "@/components/chat/Block";
import ErrorBoundary from "@/components/ui/error-boundary";

export default function Home() {
  return (
    <main>
      <ErrorBoundary>
        <Block />
      </ErrorBoundary>
    </main>
  );
}
