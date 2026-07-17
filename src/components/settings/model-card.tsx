"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatProviderName } from "@/config/models";
import type { UserModel } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

interface ModelCardProps {
  model: UserModel;
  isActive: boolean;
  onUpdateApiKey: (modelId: string, apiKey: string) => Promise<void>;
  onDelete: (modelId: string) => Promise<void>;
  onSetActive: (modelId: string) => Promise<void>;
}

export function ModelCard({
  model,
  isActive,
  onUpdateApiKey,
  onDelete,
  onSetActive,
}: ModelCardProps) {
  const [editingKey, setEditingKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    await onUpdateApiKey(model.id, apiKeyInput.trim());
    setSaving(false);
    setEditingKey(false);
    setApiKeyInput("");
  }

  async function handleDelete() {
    await onDelete(model.id);
    setDeleteConfirmOpen(false);
  }

  return (
    <Card
      className={`relative ${isActive ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{model.name}</span>
          {isActive && (
            <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{formatProviderName(model.provider)}</span>
          {" / "}
          <span>{model.model}</span>
        </div>

        {editingKey ? (
          <div className="space-y-2 pt-2">
            <Label htmlFor={`api-key-${model.id}`}>API Key</Label>
            <div className="flex gap-2">
              <Input
                id={`api-key-${model.id}`}
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter new API key"
              />
              <Button size="sm" onClick={handleSaveApiKey} disabled={saving}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingKey(false);
                  setApiKeyInput("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingKey(!editingKey)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit Key
          </Button>
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Model</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{model.name}"? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {!isActive && (
          <Button variant="ghost" size="sm" onClick={() => onSetActive(model.id)}>
            Set Active
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
