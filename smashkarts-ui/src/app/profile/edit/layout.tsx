import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/profile">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
      </div>
      {children}
    </div>
  );
}
