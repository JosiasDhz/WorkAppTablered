import type { ReactNode } from "react";

export type HomeSection = {
  id: string;
  render: () => ReactNode;
};
