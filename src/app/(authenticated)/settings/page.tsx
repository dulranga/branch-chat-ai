"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import type { UserModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModelCard } from "@/components/settings/model-card";
import { AddModelWizard } from "@/components/settings/add-model-wizard";
import { ArrowLeft, Bot, Palette, Settings } from "lucide-react";

type SettingsTab = "models" | "general" | "appearance";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("models");
  const [models, setModels] = useState<UserModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadModels = useCallback(async () => {
    try {
      const [modelsRes, activeRes] = await Promise.all([
        fetch("/api/user/models"),
        fetch("/api/user/active-model"),
      ]);
      if (modelsRes.ok) {
        setModels(await modelsRes.json());
      }
      if (activeRes.ok) {
        const active = await activeRes.json();
        setActiveModelId(active?.id ?? null);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) return;
    loadModels();
  }, [session, isPending, loadModels]);

  async function handleAddModel(
    provider: string,
    model: string,
    name: string,
    apiKey: string,
  ) {
    const res = await fetch("/api/user/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, name, apiKey }),
    });
    if (res.ok) {
      await loadModels();
    }
  }

  async function handleUpdateApiKey(modelId: string, apiKey: string) {
    const res = await fetch(`/api/user/models/${modelId}/api-key`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    if (res.ok) {
      await loadModels();
    }
  }

  async function handleDelete(modelId: string) {
    const res = await fetch(`/api/user/models/${modelId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (activeModelId === modelId) {
        setActiveModelId(null);
      }
      await loadModels();
    }
  }

  async function handleSetActive(modelId: string) {
    const res = await fetch("/api/user/active-model", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelConfigId: modelId }),
    });
    if (res.ok) {
      setActiveModelId(modelId);
    }
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to continue</p>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof Bot }[] = [
    { id: "models", label: "Models", icon: Bot },
    { id: "general", label: "General", icon: Settings },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6">
          <h1 className="font-display text-sm font-semibold tracking-tight">
            Settings
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "models" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Models</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your AI model configurations
                  </p>
                </div>
                <AddModelWizard onAdd={handleAddModel} />
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading models...
                </p>
              ) : models.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No models configured yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add your first model to start chatting
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {models.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isActive={model.id === activeModelId}
                      onUpdateApiKey={handleUpdateApiKey}
                      onDelete={handleDelete}
                      onSetActive={handleSetActive}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "general" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold">General</h2>
              <p className="text-sm text-muted-foreground mt-1">
                General settings coming soon
              </p>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Appearance settings coming soon
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
