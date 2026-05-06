/** Clases NativeWind para el contenedor del campo (borde al foco). */
export function getCredentialFieldContainerClass(focused: boolean): string {
  return `flex-row items-center h-[52px] px-3 rounded-2xl bg-whieBlueInput border-2 ${
    focused ? "border-tableOrange/80" : "border-transparent"
  }`;
}
