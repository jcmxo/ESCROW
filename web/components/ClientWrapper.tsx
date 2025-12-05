"use client";

import { EthereumProvider } from "@/lib/ethereum";
import HomeContent from "./HomeContent";

export default function ClientWrapper() {
  return (
    <EthereumProvider>
      <HomeContent />
    </EthereumProvider>
  );
}

