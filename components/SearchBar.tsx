"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [awb, setAwb] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!awb.trim()) {
      return;
    }
    router.push(`/shipments/${encodeURIComponent(awb.trim())}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        value={awb}
        onChange={(event) => setAwb(event.target.value)}
        placeholder="Enter AWB number"
        className="w-full sm:max-w-sm"
      />
      <button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
        Search
      </button>
    </form>
  );
}
