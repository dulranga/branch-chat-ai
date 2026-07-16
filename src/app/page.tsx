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
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <h1 className="text-4xl font-bold mb-4">Branching Chat</h1>
        <p className="text-lg text-zinc-500 mb-8 text-center max-w-md">
          Tree-structured AI conversations for learning. Branch off into side
          questions without losing your main thread.
        </p>
        <div className="flex gap-4">
          <a
            href="/sign-in"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 font-medium"
          >
            Sign Up
          </a>
        </div>
      </main>
    </div>
  );
}
