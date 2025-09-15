export default function Loading() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>
    </div>
  );
}

