import Orbs from "@/components/Orbs";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text">
      <Orbs />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </div>

      <div className="absolute right-5 top-5 z-30">
        <ThemeToggle />
      </div>
    </main>
  );
}