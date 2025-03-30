import { getServerSession } from "@/auth/auth-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { UserIcon } from "lucide-react";
import { SignOut } from "./_component/sign-out";

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            {session.user.image && session.user.image.trim() !== "" ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-full">
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Profile picture"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{session.user.name}</h2>
              <p className="text-muted-foreground">{session.user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Account Details</h3>
            <div className="grid gap-2 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Email verified:</span>
                <span>{session.user.emailVerified ? "Yes" : "No"}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Member since:</span>
                <span>
                  {new Date(session.user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Last updated:</span>
                <span>
                  {new Date(session.user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <SignOut />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
