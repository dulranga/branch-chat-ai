"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Settings } from "lucide-react";

export function OnboardingCard() {
  return (
    <Card className="mx-auto max-w-md border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Bot className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Configure a Model</CardTitle>
        <CardDescription>
          You need at least one AI model configured to start chatting. Head to
          settings to add your first model.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Button asChild>
          <a href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
