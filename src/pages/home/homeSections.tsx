import React from "react";
import { HomeStatusKpis } from "./kpis/HomeStatusKpis";
import type { HomeSection } from "./homeTypes";

export const HOME_SECTIONS: HomeSection[] = [
  {
    id: "status-kpis",
    render: () => <HomeStatusKpis />,
  },
];
