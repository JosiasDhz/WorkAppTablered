/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        tableOrange: "#EA7600",
        tableWarmGrey: "#696158",
        tableTeal: "#50B7C0",
        tableGold: "#F7B917",
        tableBg: "#F7F7F7",
        tableOverlayFilter: "rgba(21, 34, 93, 0.22)",
        whieBlueInput: "#F3F4F6",
        bgGlobal: "#FBFBFB",
        greenButtons: "#50834C",
        dorado: "#B8860B",
        azul: "#1C3B57",
        gris: "#4A4A4A",
        hueso: "#F5F5F3",
        amarillo: "#E2B13C",
        azul_acero: "#2E597A",
        arena_clara: "#D9C7A3",
        negro_carbon: "#1A1A1A",
        tableWhite: "#FFFFFF",
        tableBlack: "#1D1D1B",
        tableAccentRed: "#E51E2F",
      },
    },
  },
  plugins: [],
};
