"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error: err } = await signIn.email({ email, password });
    if (err) {
      setError(err.message || "Failed to sign in");
    } else {
      router.push("/chat");
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <a
            href="/"
            className="text-sm font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors"
          >
            &larr; Back
          </a>
          <h1 className="font-display text-2xl font-semibold mt-6 text-foreground">
            Sign In
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and password to sign in
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              required
              className="bg-background border-border text-foreground text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background border-border text-foreground text-sm"
            />
          </div>
          <Button
            type="submit"
            className="w-full text-sm font-medium"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Sign In
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/sign-up"
              className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
            >
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
