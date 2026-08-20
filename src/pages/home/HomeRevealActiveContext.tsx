import React, { createContext, useContext } from "react";

const HomeRevealActiveContext = createContext(true);

export function HomeRevealActiveProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <HomeRevealActiveContext.Provider value={active}>
      {children}
    </HomeRevealActiveContext.Provider>
  );
}

export function useHomeRevealActive(): boolean {
  return useContext(HomeRevealActiveContext);
}
