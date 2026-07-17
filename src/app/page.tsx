import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

function BranchLine() {
  return (
    <svg
      className="hidden lg:block absolute top-0 right-0 h-full w-48 text-border"
      style={{ maskImage: "linear-gradient(to bottom, transparent 5%, black 20%, black 80%, transparent 95%)" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <line x1="120" y1="0" x2="120" y2="100%" />
      <line x1="120" y1="20%" x2="192" y2="20%" />
      <line x1="120" y1="45%" x2="168" y2="45%" />
      <line x1="120" y1="70%" x2="144" y2="70%" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium tracking-tight text-foreground">
            Branching Chat
          </span>
          <nav className="flex items-center gap-6">
            <a
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="text-sm font-medium text-primary-foreground bg-primary px-4 py-1.5 hover:bg-primary/90 transition-colors"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <BranchLine />
          <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-8">
                Tree-structured conversations
              </p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight text-foreground">
                Follow every thread
                <br />
                <span className="text-primary">to its end</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
                Branching Chat turns linear conversation into a tree of ideas.
                Follow side questions wherever they lead, then weave insights
                back into your main thread.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  Start free
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-foreground border border-border hover:bg-muted transition-colors"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          <div className="border-t border-border" />
        </div>

        <section id="how-it-works" className="py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-xl mb-16">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
                How it works
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                Conversations grow
                <br />
                <span className="text-primary">like your thinking does</span>
              </h2>
            </div>
            <div className="grid gap-12 md:grid-cols-3 md:gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-5xl font-display font-semibold text-accent/60">01</span>
                <h3 className="text-base font-semibold text-foreground">Branch from any point</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Fork a new conversation from any message. Explore a side
                  question without losing your place in the main thread.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-5xl font-display font-semibold text-accent/60">02</span>
                <h3 className="text-base font-semibold text-foreground">Explore without limits</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Every branch is a full conversation. Go as deep as you need,
                  then pick up where you left off.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-5xl font-display font-semibold text-accent/60">03</span>
                <h3 className="text-base font-semibold text-foreground">Merge insights back</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  When a branch bears fruit, merge it back as a summary. Keep
                  what is useful, leave the rest.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          <div className="border-t border-border" />
        </div>

        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-xl mb-16">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
                Why branches
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                Linear chat assumes you
                <br />
                <span className="text-primary">already know the path</span>
              </h2>
            </div>
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">Linear chat</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-muted-foreground/40" />
                    Every tangent competes for the same scrollback
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-muted-foreground/40" />
                    One wrong turn buries what came before
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-muted-foreground/40" />
                    No way to revisit a fork you did not take
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-primary">Branching Chat</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-primary" />
                    Every branch is its own clean conversation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-primary" />
                    The main thread stays undisturbed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] block h-px w-3 shrink-0 bg-primary" />
                    Revisit, merge, or discard any branch
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          <div className="border-t border-border" />
        </div>

        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
                Start exploring
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
                The best conversations
                <br />
                <span className="text-primary">take unexpected turns</span>
              </h2>
              <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
                Create your first branching conversation in seconds. No credit
                card required.
              </p>
              <div className="mt-8">
                <a
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  Create free account
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Branching Chat
          </span>
          <nav className="flex items-center gap-6">
            <a href="/sign-in" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </a>
            <a href="/sign-up" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign Up
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
