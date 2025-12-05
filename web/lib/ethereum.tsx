import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

interface EthereumContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const EthereumContext = createContext<EthereumContextType | undefined>(undefined);

export function EthereumProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const checkConnection = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        await connect();
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
    } catch (error) {
      console.error("Error connecting:", error);
      alert("Failed to connect wallet");
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }
    
    setMounted(true);
    
    // Delay connection check to avoid hydration issues
    const timer = setTimeout(() => {
      checkConnection();
    }, 500);
    
    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChangedWrapper = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChangedWrapper);
      window.ethereum.on("chainChanged", () => window.location.reload());

      return () => {
        clearTimeout(timer);
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChangedWrapper);
        }
      };
    } else {
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always render the provider to avoid hydration issues
  return (
    <EthereumContext.Provider
      value={{
        provider,
        signer,
        account,
        connect,
        disconnect,
        isConnected: !!account && mounted,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
}

export function useEthereum() {
  const context = useContext(EthereumContext);
  if (context === undefined) {
    throw new Error("useEthereum must be used within an EthereumProvider");
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}
