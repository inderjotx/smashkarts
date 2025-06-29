"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

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
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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
        </nav>
      </div>
    </div>
  );
}
