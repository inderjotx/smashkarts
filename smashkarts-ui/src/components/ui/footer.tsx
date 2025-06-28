import Link from "next/link";
import { GamepadIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-dashed border-primary/20 bg-gray-50 px-4 py-12 dark:bg-gray-900/50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="col-span-1">
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                <GamepadIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent">
                TourneyPro
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The ultimate tournament hosting platform for competitive gaming.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="#" className="text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  API
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="#" className="text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Community
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="#" className="text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary/20 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} TourneyPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
