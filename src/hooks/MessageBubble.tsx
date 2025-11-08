import { useWebhook } from "../hooks/useWebhook";

export default function MessageBubble({ url }: { url?: string }) {
  const { message, setMessage } = useWebhook(url, 20000);
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="relative rounded-2xl border border-border bg-card px-4 py-3 text-foreground shadow-lg">
        <button
          aria-label="close"
          className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition-colors hover:bg-muted"
          onClick={() => setMessage(null)}
        >
          ×
        </button>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message}</div>
        <div
          className="absolute -bottom-2 right-6 h-0 w-0 border-l-8 border-l-transparent border-t-8"
          style={{ borderTopColor: "hsl(var(--card))" }}
        />
      </div>
    </div>
  );
}
