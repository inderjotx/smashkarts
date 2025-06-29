"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const tabs = [
  {
    name: "Basic",
    href: "basic",
  },
  {
    name: "Participation",
    href: "participation",
  },
  {
    name: "Category & Team",
    href: "category-team",
  },
] as const;

export function NavigationTabs() {
  const pathname = usePathname();
  const { slug } = useParams();

  return (
    <div className="sticky top-16 z-10 bg-background">
      <div className="mx-auto max-w-7xl border-b border-dashed">
        <nav
          className="-mb-px flex items-center justify-between"
          aria-label="Tabs"
        >
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const href = `/tournament/${slug?.toString()}/edit/${tab.href}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={tab.name}
                  href={href}
                  className={cn(
                    "inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium",
                    {
                      "border-b-2 border-primary font-semibold text-primary":
                        isActive,
                      "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground":
                        !isActive,
                    },
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
          <Link
            href={`/tournament/${slug?.toString()}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournament
          </Link>
        </nav>
      </div>
    </div>
  );
}
