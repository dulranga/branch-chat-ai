"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getModelCatalog,
  formatProviderName,
} from "@/config/models";
import { Plus } from "lucide-react";

interface AddModelWizardProps {
  onAdd: (
    provider: string,
    model: string,
    name: string,
    apiKey: string,
  ) => Promise<void>;
}

type Step = "provider" | "model" | "config";

export function AddModelWizard({ onAdd }: AddModelWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("provider");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const catalog = getModelCatalog();

  const filteredModels = useMemo(() => {
    if (!selectedProvider) return [];
    const models = catalog[selectedProvider].models;
    if (!modelSearch.trim()) return models;
    const q = modelSearch.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [selectedProvider, modelSearch, catalog]);

  function reset() {
    setStep("provider");
    setSelectedProvider(null);
    setSelectedModel(null);
    setModelSearch("");
    setName("");
    setApiKey("");
  }

  function handleProviderPick(provider: string) {
    setSelectedProvider(provider);
    setSelectedModel(null);
    setName(formatProviderName(provider) + " ");
    setStep("model");
  }

  function handleModelPick(model: string) {
    setSelectedModel(model);
    setStep("config");
    setName(
      formatProviderName(selectedProvider ?? "") + " " + model,
    );
  }

  async function handleSave() {
    if (!selectedProvider || !selectedModel || !apiKey.trim()) return;
    setSaving(true);
    await onAdd(selectedProvider, selectedModel, name || `${selectedProvider} ${selectedModel}`, apiKey);
    setSaving(false);
    setOpen(false);
    reset();
  }

  const providers = Object.keys(catalog);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Add Model
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "provider"
              ? "Select Provider"
              : step === "model"
                ? "Select Model"
                : "Configure Model"}
          </DialogTitle>
          <DialogDescription>
            {step === "provider"
              ? "Choose an AI provider to get started."
              : step === "model"
                ? `Select a model from ${selectedProvider ? formatProviderName(selectedProvider) : ""}.`
                : "Give your model a name and enter your API key."}
          </DialogDescription>
        </DialogHeader>

        {step === "provider" && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {providers.map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="h-20 flex-col gap-1"
                onClick={() => handleProviderPick(provider)}
              >
                <span className="text-sm font-medium">
                  {formatProviderName(provider)}
                </span>
              </Button>
            ))}
          </div>
        )}

        {step === "model" && selectedProvider && (
          <div className="space-y-2 py-4">
            <Input
              placeholder="Search models..."
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredModels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No models match your search
                </p>
              ) : (
                filteredModels.map((model) => (
                  <Button
                    key={model}
                    variant="outline"
                    className="w-full justify-start h-auto py-2"
                    onClick={() => handleModelPick(model)}
                  >
                    <span className="text-sm">{model}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        {step === "config" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input
                id="model-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Model"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step !== "provider" && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === "model") {
                  setStep("provider");
                } else if (step === "config") {
                  setStep("model");
                }
              }}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          {step === "config" && (
            <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
              {saving ? "Saving..." : "Save Model"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
