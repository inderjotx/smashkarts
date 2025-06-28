import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Play,
  ArrowRight,
  GamepadIcon,
  Target,
  Crown,
} from "lucide-react";
import Link from "next/link";

export default function TournamentHomepage() {
  const stats = [
    { number: "3000", label: "Active Players", icon: Users },
    { number: "10+", label: "Tournaments Hosted", icon: Trophy },
    { number: "99.9%", label: "Uptime", icon: Shield },
    { number: "₹40,000+", label: "Prize Pool Distributed", icon: Crown },
  ];

  const features = [
    {
      icon: Calendar,
      title: "Tournament Management",
      description:
        "Create, manage, and track tournaments with our comprehensive dashboard",
    },
    {
      icon: Users,
      title: "Player Registration",
      description:
        "Seamless registration system with automated bracket generation",
    },
    {
      icon: BarChart3,
      title: " Analytics",
      description:
        "Track performance, engagement, and tournament statistics in real-time",
    },
    {
      icon: Target,
      title: "Custom Brackets",
      description:
        "Flexible bracket systems supporting various tournament formats",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900 dark:bg-black dark:text-white">
      {/* Hero Section */}
      <section className="px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div>
              <Badge className="mb-6 border-primary/20 bg-primary/10 text-primary transition-colors duration-300 hover:bg-primary/20">
                <Zap className="mr-2 h-4 w-4" />
                Next-Gen Tournament Platform
              </Badge>

              <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Host Epic
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Tournaments
                </span>
                Like Never Before
              </h1>

              <p className="mb-8 text-xl leading-relaxed text-gray-600 dark:text-gray-400">
                The ultimate platform for organizing, managing, and broadcasting
                competitive gaming tournaments. From local competitions to
                global championships - we&apos;ve got you covered.
              </p>

              <div className="mb-12 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="group transform bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-lg font-semibold text-primary-foreground transition-all duration-300 hover:scale-105 hover:from-primary/90 hover:to-primary/70"
                >
                  Start Your Tournament
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group border-primary bg-transparent px-8 py-6 text-lg font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  <Play className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Watch Demo
                </Button>
              </div>

              {/* Key Features List */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center bg-gradient-to-r from-primary to-primary/80">
                    <Trophy className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Professional tournament management tools
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center bg-gradient-to-r from-primary to-primary/80">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Automated player registration & brackets
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center bg-gradient-to-r from-primary to-primary/80">
                    <Zap className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Real-time streaming & analytics
                  </span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div>
              <div className="relative">
                <Image
                  src="/images/gaming-hero.png"
                  alt="Gaming Tournament Character"
                  width={500}
                  height={500}
                  className="relative z-10 mx-auto h-auto w-full max-w-xl"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <Card className="border-primary/20 bg-gray-50 transition-all duration-300 hover:scale-105 hover:transform hover:border-primary/40 dark:bg-gray-900/50">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <div className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gray-50 px-4 py-20 dark:bg-gray-900/30 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Powerful Features for
              <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Tournament Organizers
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              Everything you need to create, manage, and execute successful
              tournaments
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-primary/20 bg-white transition-all duration-300 hover:scale-105 hover:transform hover:border-primary/40 dark:bg-black/50"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-gradient-to-br from-primary to-primary/80 transition-transform duration-300 group-hover:rotate-6">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900 transition-colors duration-300 group-hover:text-primary dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-12">
            <div className="to-primary/2 absolute inset-0 bg-gradient-to-r from-primary/5"></div>
            <div className="relative z-10">
              <Trophy className="mx-auto mb-6 h-16 w-16 text-primary" />
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Ready to Host Your First Tournament?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
                Join thousands of organizers who trust TourneyPro to deliver
                exceptional tournament experiences
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="transform bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-lg font-semibold text-primary-foreground transition-all duration-300 hover:scale-105 hover:from-primary/90 hover:to-primary/70"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary bg-transparent px-8 py-6 text-lg font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-gray-50 px-4 py-12 dark:bg-gray-900/50 sm:px-6 lg:px-8">
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
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    API
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
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
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
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
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-primary"
                  >
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
    </div>
  );
}
