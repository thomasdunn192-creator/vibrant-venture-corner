interface AdBannerProps {
  enabled: boolean;
}

export function AdBanner({ enabled }: AdBannerProps) {
  if (!enabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-2 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
        <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          Ad
        </span>
        <span className="text-sm text-muted-foreground">
          Ad slot reserved — connect your network to display here.
        </span>
      </div>
    </div>
  );
}
