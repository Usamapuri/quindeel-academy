"use client";

import { createContext, useContext } from "react";

const EditCtx = createContext<{ canEdit: boolean }>({ canEdit: false });

/** Provided in the root layout: true only when a TEACHER is logged in. */
export function EditProvider({ canEdit, children }: { canEdit: boolean; children: React.ReactNode }) {
  return <EditCtx.Provider value={{ canEdit }}>{children}</EditCtx.Provider>;
}

export function useEdit() {
  return useContext(EditCtx);
}
