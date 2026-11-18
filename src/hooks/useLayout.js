import { useContext } from "react";
import { LayoutContext } from "../context/layout-context";

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout debe usarse dentro de LayoutProvider");
  return ctx;
}
