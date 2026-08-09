"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Scan, Camera, CameraOff, AlertCircle, RefreshCw, X } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { getCurrentUser } from "@/lib/auth";

type ScannerState = 
  | "idle" 
  | "requesting_permission" 
  | "scanning" 
  | "permission_denied" 
  | "camera_unavailable" 
  | "invalid_qr" 
  | "success";

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string>("");
  const [scannedUrl, setScannedUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const requestCamera = async () => {
    setState("requesting_permission");
    
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      );
      
      setState("scanning");
    } catch (err) {
      console.error("Camera error:", err);
      
      if (err instanceof Error) {
        if (err.message.includes("Permission denied") || err.message.includes("NotAllowedError")) {
          setState("permission_denied");
          setError("Camera access was denied. Please allow camera access in your browser settings.");
        } else if (err.message.includes("NotFoundError") || err.message.includes("no camera")) {
          setState("camera_unavailable");
          setError("No camera found on this device.");
        } else {
          setState("camera_unavailable");
          setError("Unable to access camera. Please check your device settings.");
        }
      } else {
        setState("camera_unavailable");
        setError("Unable to access camera.");
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    console.log("Scanned:", decodedText);
    setScannedUrl(decodedText);

    if (isValidVibeLinkUrl(decodedText)) {
      const username = extractUsername(decodedText);
      if (username) {
        handleSuccessfulScan(username, decodedText);
      } else {
        setState("invalid_qr");
        setError("That doesn't look like a VibeLink QR code.");
        setIsProcessing(false);
      }
    } else {
      setState("invalid_qr");
      setError("That doesn't look like a VibeLink QR code.");
      setIsProcessing(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore scan failures - they're normal when no QR is in frame
  };

  const isValidVibeLinkUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      
      // Validate hostname is the VibeLink production domain
      if (urlObj.hostname !== 'vibelinks.vercel.app') {
        return false;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Check if path matches exactly /u/username pattern
      if (pathParts.length === 2 && pathParts[0] === 'u') {
        const username = pathParts[1];
        // Username should be alphanumeric with some special chars
        return /^[a-zA-Z0-9_-]+$/.test(username);
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const extractUsername = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length === 2 && pathParts[0] === 'u') {
        return pathParts[1];
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleSuccessfulScan = async (username: string, url: string) => {
    setState("success");
    
    // Stop scanning
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }

    // Check if user is scanning their own QR
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Get current user's profile to check username
        const { getProfileByUsername } = await import("@/lib/auth");
        const userProfile = await getProfileByUsername(username);
        
        if (userProfile && userProfile.id === currentUser.id) {
          // User scanned their own QR - redirect to my-card
          setTimeout(() => {
            router.push("/my-card");
          }, 500);
          return;
        }
      }
    } catch (err) {
      console.error("Error checking self-scan:", err);
    }

    // Navigate to the scanned profile
    setTimeout(() => {
      router.push(`/u/${username}`);
    }, 500);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }
    setState("idle");
    setIsProcessing(false);
  };

  const tryAgain = () => {
    setState("idle");
    setError("");
    setScannedUrl("");
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Scan QR Code</h1>
            <p className="text-foreground/70 mb-6 text-center">
              Point your camera at a VibeLink QR code
            </p>

            {/* Scanner Container */}
            <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
              {state === "idle" && (
                <div className="p-8 text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Scan className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-foreground/70 mb-6">
                    Allow camera access to scan a VibeLink QR code.
                  </p>
                  <button
                    onClick={requestCamera}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Enable Camera
                  </button>
                </div>
              )}

              {state === "requesting_permission" && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <p className="text-foreground/70">
                    Requesting camera access...
                  </p>
                </div>
              )}

              {state === "scanning" && (
                <div className="relative">
                  <div id="reader" className="w-full" />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={stopScanner}
                      className="bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors"
                      aria-label="Stop scanning"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-sm text-foreground/70 bg-background/80 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
                      Point at a VibeLink QR code
                    </p>
                  </div>
                </div>
              )}

              {state === "permission_denied" && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CameraOff className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Camera Access Denied
                  </h2>
                  <p className="text-foreground/70 mb-6">
                    Camera access was denied. Please allow camera access in your browser settings and try again.
                  </p>
                  <button
                    onClick={tryAgain}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              )}

              {state === "camera_unavailable" && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CameraOff className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Camera Unavailable
                  </h2>
                  <p className="text-foreground/70 mb-6">
                    {error || "Unable to access camera. Please check your device settings."}
                  </p>
                  <button
                    onClick={tryAgain}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              )}

              {state === "invalid_qr" && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Invalid QR Code
                  </h2>
                  <p className="text-foreground/70 mb-6">
                    That doesn't look like a VibeLink QR code.
                  </p>
                  <button
                    onClick={tryAgain}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Scan Again
                  </button>
                </div>
              )}

              {state === "success" && (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Scan className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    QR Code Scanned!
                  </h2>
                  <p className="text-foreground/70">
                    Opening profile...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}