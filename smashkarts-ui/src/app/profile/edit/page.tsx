import { getServerSession } from "@/auth/auth-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { UserForm } from "./form";

export default async function EditProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session?.user.id ?? ""),
  });

  if (!userData) {
    redirect("/sign-in");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <UserForm userData={userData} />
      </CardContent>
    </Card>
  );
}
