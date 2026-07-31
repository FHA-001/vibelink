"use client";

import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 200, className }: QRCodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("bg-white p-4 rounded-2xl shadow-lg", className)}
    >
      <div className="relative">
        <QRCodeCanvas
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          className="w-full h-auto"
        />
        {/* Center logo placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-2 shadow-md">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}