export const DRIVER_ROUTE_PIN_ICON_SIZE = 40;

export const DRIVER_ROUTE_PIN_ANCHOR = { x: 20, y: 40 };

function escapeSvgText(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDriverRoutePinSvgDataUrl(params: {
  fillColor: string;
  numberText: string;
}): string {
  const fillColor = params.fillColor?.trim() || "#EA7600";
  const numberText = escapeSvgText(params.numberText);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
        fill="${fillColor}"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <circle cx="12" cy="9" r="4.8" fill="#ffffff" />
      <text x="12" y="10.6" text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="6.2"
        font-weight="700"
        fill="${fillColor}">
        ${numberText}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
