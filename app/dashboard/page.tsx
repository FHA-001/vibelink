"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to My Card since dashboard is deprecated
    router.replace("/my-card");
  }, [router]);

  return null;
}