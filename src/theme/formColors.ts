import { useMemo } from "react";
import { useAppAppearance } from "./appearance";
import type { SoftPalette } from "./softUi";

export type FormColors = {
  layout: string;
  surface: string;
  ink: string;
  muted: string;
  divider: string;
  field: string;
  fieldFocus: string;
  accent: string;
  accentSoft: string;
  warnBg: string;
  warnText: string;
  warnBorder: string;
  roseSoft: string;
  roseText: string;
  emerald: string;
  emeraldSoft: string;
};

export function formColorsFromSoft(soft: SoftPalette): FormColors {
  return {
    layout: soft.layout,
    surface: soft.surface,
    ink: soft.ink,
    muted: soft.mutedInk,
    divider: soft.border,
    field: soft.field,
    fieldFocus: soft.fieldFocus,
    accent: soft.accent,
    accentSoft: soft.accentSoft,
    warnBg: soft.warningBg,
    warnText: soft.warningText,
    warnBorder: soft.warningBorder,
    roseSoft: soft.roseSoft,
    roseText: soft.roseText,
    emerald: soft.emerald,
    emeraldSoft: soft.emeraldSoft,
  };
}

export function useFormColors(): FormColors {
  const { colors } = useAppAppearance();
  return useMemo(() => formColorsFromSoft(colors), [colors]);
}
