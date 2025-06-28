import { getServerSession } from "@/auth/auth-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { UserIcon } from "lucide-react";
import { SignOut } from "./_component/sign-out";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProfilePage() {
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
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {userData.image && userData.image.trim() !== "" ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full">
                  <Image
                    src={userData.image}
                    alt={userData.name ?? "Profile picture"}
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
                <h2 className="text-2xl font-bold">{userData.name}</h2>
                <p className="text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile/edit">
                <Button variant="outline">Edit Profile</Button>
              </Link>
              <SignOut />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Account Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                  Member since:
                </span>
                <span>
                  {new Date(session.user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex">
                <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                  Last updated:
                </span>
                <span>
                  {new Date(session.user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {userData.sId && (
                <div className="flex">
                  <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                    Smashkart ID:
                  </span>
                  <span>{userData.sId}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                  Games Played:
                </span>
                <span>{userData.gamesPlayed}</span>
              </div>
              <div className="flex">
                <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                  K/D Ratio:
                </span>
                <span>{userData.kd}</span>
              </div>
              {userData.description && (
                <div className="flex">
                  <span className="w-[150px] flex-shrink-0 text-muted-foreground">
                    Description:
                  </span>
                  <div
                    className="flex-1"
                    dangerouslySetInnerHTML={{ __html: userData.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
