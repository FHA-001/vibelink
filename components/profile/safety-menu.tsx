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
}

export function SafetyMenu({ onBlock, onReport, isBlocked, onUnblock }: SafetyMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-foreground/70 hover:text-foreground transition-colors">
        <MoreVertical className="w-5 h-5" />
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
