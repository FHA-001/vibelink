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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUsername: string;
  onConfirm: (reason: string, details?: string) => Promise<void>;
}

const REPORT_REASONS = [
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
] as const;

export function ReportDialog({ open, onOpenChange, targetUsername, onConfirm }: ReportDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOtherReason = reason === 'other';
  const detailsRequired = isOtherReason;
  const detailsValid = !detailsRequired || (details.trim().length > 0 && details.length <= 2000);
  const canSubmit = reason && detailsValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason, details.trim() || undefined);
      onOpenChange(false);
      setReason('');
      setDetails('');
    } catch (error) {
      console.error("Report failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setReason('');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report @{targetUsername}</DialogTitle>
          <DialogDescription>
            Help us keep VibeLink safe by reporting this profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
              disabled={isSubmitting}
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Details {detailsRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="details"
              placeholder={isOtherReason ? "Please provide details about your report" : "Additional details (optional)"}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting}
              maxLength={2000}
            />
            {details && (
              <p className="text-xs text-muted-foreground">
                {details.length}/2000 characters
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
