import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-12 text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">Branching Chat</h1>
          <p className="text-lg text-muted-foreground">
            Tree-structured AI conversations for learning. Branch off into side
            questions without losing your main thread.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            <a
              href="/sign-in"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-8"
            >
              Sign Up
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
