import { useStore } from "./store";
import { useAutosave } from "./useAutosave";
import { Sidebar } from "./components/Sidebar";
import { TierBoard } from "./components/TierBoard";
import { ToastContainer } from "./components/Toast";

export default function App() {
  const currentList = useStore((s) => s.currentList);
  useAutosave();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {currentList ? (
          <TierBoard list={currentList} />
        ) : (
          <EmptyState />
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 gap-2">
      <div className="text-lg text-slate-300">No tier list open</div>
      <div className="text-sm">
        Pick a list from the sidebar, or click <span className="text-slate-300">+</span> to create one.
      </div>
    </div>
  );
}
