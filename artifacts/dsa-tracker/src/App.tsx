import { useState } from "react";
import { Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Terminal } from "lucide-react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Dashboard } from "@/pages/Dashboard";
import { Questions } from "@/pages/Questions";
import { HeatMap } from "@/pages/HeatMap";
import { Sheets } from "@/pages/Sheets";
import { RevisionMode } from "@/pages/RevisionMode";

const queryClient = new QueryClient();

type Tab = "dashboard" | "questions" | "heatmap" | "sheets" | "revision";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "questions", label: "All Questions" },
  { id: "sheets", label: "Sheets" },
  { id: "revision", label: "Revision Mode" },
  { id: "heatmap", label: "Heatmap" },
];

function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight font-mono">DSA Revision</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "questions" && <Questions />}
        {activeTab === "sheets" && <Sheets />}
        {activeTab === "revision" && <RevisionMode />}
        {activeTab === "heatmap" && <HeatMap />}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="dsa-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
