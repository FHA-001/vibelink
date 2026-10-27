import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="page-canvas flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center px-4 py-5 sm:px-8">
        <Link href="/" aria-label="VibeLink home" className="rounded-lg">
          <Logo />
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="font-heading text-8xl font-semibold leading-none text-gold/40" aria-hidden="true">
            404
          </p>
          <h1 className="mt-4 font-heading text-3xl font-semibold">Page not found</h1>
          <p className="mt-3 text-muted-foreground">
            This page does not exist or has moved. Check the address, or head back home.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={buttonVariants({ size: "lg", className: "px-8" })}>
              Back to home
            </Link>
            <Link
              href="/signin"
              className={buttonVariants({ variant: "outline", size: "lg", className: "px-8" })}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
