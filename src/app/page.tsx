"use client";

import { trpc } from "@/trpc/client";

// Temporary page that only verifies the tRPC wiring end to end.
// It is replaced by the real task list in step 3.
export default function Home() {
  const ping = trpc.ping.useQuery();

  if (ping.isPending) {
    return <p className="p-8">Loading...</p>;
  }

  if (ping.isError) {
    return <p className="p-8 text-red-600">Error: {ping.error.message}</p>;
  }

  return (
    <main className="space-y-2 p-8">
      <p>Server says: {ping.data.message}</p>
      <p>Server time: {ping.data.serverTime.toLocaleString()}</p>
      <p>
        serverTime is a Date instance:{" "}
        {String(ping.data.serverTime instanceof Date)}
      </p>
    </main>
  );
}
