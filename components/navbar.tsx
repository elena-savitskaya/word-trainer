import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { MobileNav } from "@/components/mobile-nav";

interface NavbarProps {
  hasEnvVars: boolean;
}

export function Navbar({ hasEnvVars }: NavbarProps) {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center py-3 px-4 sm:px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={65} height={65} priority/>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeSwitcher />
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>

        {/* Mobile Burger Menu */}
        <div className="flex md:hidden">
          <Suspense fallback={<div className="w-10 h-10" />}>
            <MobileNav
              authButton={<AuthButton />}
              themeSwitcher={<ThemeSwitcher />}
            />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
