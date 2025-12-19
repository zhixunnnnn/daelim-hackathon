import { useState } from "react";
import Dashboard from "./Dashboard";
import Module1 from "./Module1";
import Module2 from "./Module2";
import Module3 from "./Module3";
import Module4 from "./Module4";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";
import "./App.css";

type ActivePage =
  | "dashboard"
  | "csvAnalysis"
  | "textAnalysis"
  | "imageAnalysis"
  | "glossary";

function App() {
  const toast = useToast();
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  return (
    <div className="app">
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="main">
        <div
          style={{ display: activePage === "dashboard" ? "contents" : "none" }}
        >
          <Dashboard onNavigate={setActivePage} />
        </div>
        <div
          style={{
            display: activePage === "csvAnalysis" ? "contents" : "none",
          }}
        >
          <Module1 onBack={() => setActivePage("dashboard")} toast={toast} />
        </div>
        <div
          style={{
            display: activePage === "textAnalysis" ? "contents" : "none",
          }}
        >
          <Module2 onBack={() => setActivePage("dashboard")} toast={toast} />
        </div>
        <div
          style={{
            display: activePage === "imageAnalysis" ? "contents" : "none",
          }}
        >
          <Module3 onBack={() => setActivePage("dashboard")} toast={toast} />
        </div>
        {activePage === "glossary" && (
          <div style={{ display: "contents" }}>
            <Module4 />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
