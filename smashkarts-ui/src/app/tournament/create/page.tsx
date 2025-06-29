import { redirect } from "next/navigation";
import CreateTournamentForm from "./form";
import { getServerSession } from "@/auth/auth-server";

export default async function CreateTournamentPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <CreateTournamentForm />
    </div>
  );
}
