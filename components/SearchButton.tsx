"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/search");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </>
        ) : (
          <>
            <Search className="h-4 w-4" strokeWidth={1.75} /> Search jobs
          </>
        )}
      </Button>
      {error && <span className="max-w-[220px] text-right text-xs text-muted">{error}</span>}
    </div>
  );
}
