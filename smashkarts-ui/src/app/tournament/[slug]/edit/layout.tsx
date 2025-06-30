import { NavigationTabs } from "../_components/navigation-tabs";

export default function TournamentEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationTabs />
      <main className="flex-1 py-4 md:py-10">{children}</main>
    </div>
  );
}
