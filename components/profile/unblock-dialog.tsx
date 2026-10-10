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

interface UnblockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUsername: string;
  onConfirm: () => Promise<void>;
}

export function UnblockDialog({ open, onOpenChange, targetUsername, onConfirm }: UnblockDialogProps) {
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleUnblock = async () => {
    setIsUnblocking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Unblock failed:", error);
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unblock @{targetUsername}?</DialogTitle>
          <DialogDescription>
            They will be able to view your profile and connect with you again. You'll need to send a new connection request to reconnect.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUnblocking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnblock}
            disabled={isUnblocking}
          >
            {isUnblocking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unblocking...
              </>
            ) : (
              "Unblock user"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
