"use client";

import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCode = forwardRef<HTMLCanvasElement, QRCodeProps>(
  ({ value, size = 200, className }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative rounded-2xl border border-border bg-white p-4 shadow-md",
          className
        )}
      >
        <div className="relative">
          <QRCodeCanvas
            ref={ref}
            value={value}
            size={size}
            level="H"
            includeMargin={false}
            fgColor="#182D3A"
            bgColor="#FFFFFF"
            className="h-auto w-full"
            role="img"
            aria-label="QR code that opens this VibeLink profile"
          />
          {/* Centre mark. Cosmetic only; it is not part of the downloaded image. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-white p-1.5 shadow-md">
              <img src="/logo-mark.png" alt="" width={24} height={24} className="size-6 object-contain" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

QRCode.displayName = "QRCode";
