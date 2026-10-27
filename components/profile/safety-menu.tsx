"use client";

import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SafetyMenuProps {
  onBlock: () => void;
  onReport: () => void;
  isBlocked?: boolean;
  onUnblock?: () => void;
  /** Use light icon colours when the menu sits on a navy surface. */
  onDark?: boolean;
}

export function SafetyMenu({ onBlock, onReport, isBlocked, onUnblock, onDark = false }: SafetyMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          onDark
            ? "flex size-9 items-center justify-center rounded-lg text-ivory/80 transition-colors hover:bg-white/10 hover:text-ivory"
            : "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
        }
        aria-label="More options"
      >
        <MoreVertical className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isBlocked ? (
          <DropdownMenuItem onClick={onUnblock} className="text-foreground focus:text-foreground">
            Unblock user
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onBlock} className="text-destructive focus:text-destructive">
            Block user
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onReport} className="text-destructive focus:text-destructive">
          Report profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
