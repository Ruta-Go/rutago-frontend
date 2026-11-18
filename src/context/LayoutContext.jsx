import { useState, useCallback } from "react";
import { LayoutContext } from "./layout-context";

export function LayoutProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => setSidebarCollapsed((v) => !v), []);

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        toggleCollapse,
        setSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
