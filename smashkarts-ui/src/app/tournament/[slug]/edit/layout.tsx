import { NavigationTabs } from "../_components/navigation-tabs";

export default function TournamentEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationTabs />
      <main className="flex-1">{children}</main>
    </div>
  );
}
