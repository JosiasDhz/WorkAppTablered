import { useAppAppearance } from "./appearance";
import type { SoftPalette } from "./softUi";

export function createThemedStyles<Palette, Styles>(
  usePalette: () => Palette,
  build: (palette: Palette) => Styles,
): () => Styles {
  const cache = new WeakMap<SoftPalette, Styles>();
  return function useThemedStyles(): Styles {
    const { colors } = useAppAppearance();
    const palette = usePalette();
    const cached = cache.get(colors);
    if (cached) return cached;
    const created = build(palette);
    cache.set(colors, created);
    return created;
  };
}
