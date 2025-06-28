"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Menu, X, GamepadIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/auth/auth-client";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-dashed border-primary/20 bg-white/90 backdrop-blur-sm dark:bg-black/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-0">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                <GamepadIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent">
                TourneyPro
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/tournament"
              className="text-gray-600 transition-colors duration-300 hover:text-primary dark:text-gray-300"
            >
              Tournaments
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 transition-colors duration-300 hover:text-primary dark:text-gray-300"
            >
              Contact
            </Link>
            <ThemeSwitcher />
            {session ? (
              <Link href="/profile">
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary/20 transition-all duration-300 hover:scale-105 hover:border-primary">
                  <AvatarImage
                    src={session.user?.image ?? ""}
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="border-primary bg-transparent text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
            <Button className="transform bg-gradient-to-r from-primary to-primary/80 text-primary-foreground transition-all duration-300 hover:scale-105 hover:from-primary/90 hover:to-primary/70">
              <Link href="/tournament">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-dashed border-primary/20 bg-white duration-300 animate-in slide-in-from-top dark:bg-black md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="#tournaments"
              className="block px-3 py-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300"
            >
              Tournaments
            </Link>
            <Link
              href="#contact"
              className="block px-3 py-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300"
            >
              Contact
            </Link>
            {/* <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-600 dark:text-gray-300">Theme:</span>
              <ThemeSwitcher />
            </div> */}
            <div className="space-y-2 px-3 py-2">
              {session ? (
                <Link
                  href="/profile"
                  className="flex items-center justify-center"
                >
                  <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary/20 transition-all duration-300 hover:scale-105 hover:border-primary">
                    <AvatarImage
                      src={session.user?.image ?? ""}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70">
                <Link href="/tournament">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
