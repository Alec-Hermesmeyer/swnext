import { createContext, useContext, useState, useCallback } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [extra, setExtra] = useState(null);

  const setSidebarExtra = useCallback((node) => {
    setExtra(node);
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebarExtra: extra, setSidebarExtra }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarExtra() {
  const ctx = useContext(SidebarContext);
  return ctx?.sidebarExtra || null;
}

export function useSetSidebarExtra() {
  const ctx = useContext(SidebarContext);
  return ctx?.setSidebarExtra || (() => {});
}
