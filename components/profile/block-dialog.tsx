"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUsername: string;
  onConfirm: () => Promise<void>;
}

export function BlockDialog({ open, onOpenChange, targetUsername, onConfirm }: BlockDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Block failed:", error);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block @{targetUsername}?</DialogTitle>
          <DialogDescription>
            They will no longer be able to view your profile or connect with you. Any pending request or existing connection between you will be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBlocking}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={isBlocking}
          >
            {isBlocking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Blocking...
              </>
            ) : (
              "Block user"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
