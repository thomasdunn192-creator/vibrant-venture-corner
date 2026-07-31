import { Link, useRouter } from "@tanstack/react-router";
import {
  Cog,
  FlaskConical,
  Home,
  MessageSquareText,
  Printer,
  Wrench,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PrinterSelector } from "@/components/printer-selector";
import { AdBanner } from "@/components/ad-banner";
import { useAppSettingsContext } from "@/components/app-settings-provider";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { settings, setSelectedPrinterId, setAdsEnabled } = useAppSettingsContext();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/filament", label: "Filament", icon: FlaskConical },
    { to: "/setup", label: "Setup", icon: Wrench },
    { to: "/troubleshooting", label: "Troubleshoot", icon: MessageSquareText },
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline">PrintOps</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <PrinterSelector
              value={settings.selectedPrinterId}
              onChange={setSelectedPrinterId}
              className="w-40 sm:w-52"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Cog className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-between gap-4"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="text-sm">Show ads</span>
                  <Switch
                    checked={settings.adsEnabled}
                    onCheckedChange={setAdsEnabled}
                    aria-label="Toggle ads"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center justify-around border-t border-border px-2 py-1 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      <AdBanner enabled={settings.adsEnabled} />
    </div>
  );
}
