import type { NavigationProp, ParamListBase } from "@react-navigation/native";

const ROOT_DRIVER_ROUTE_SCREENS = [
  "DriverRouteDetail",
  "DriverRouteConfirmMercancia",
  "DriverRouteProductPickup",
  "DriverRouteNavFirstStop",
] as const;

function rootNavigator(navigation: NavigationProp<ParamListBase>) {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const routeNames = (current.getState?.() as { routeNames?: string[] } | undefined)
      ?.routeNames;
    if (routeNames?.some((name) => ROOT_DRIVER_ROUTE_SCREENS.includes(name as (typeof ROOT_DRIVER_ROUTE_SCREENS)[number]))) {
      return current;
    }
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }
  return navigation;
}

function navigateRootDriverRoute(
  navigation: NavigationProp<ParamListBase>,
  screen: (typeof ROOT_DRIVER_ROUTE_SCREENS)[number],
  routeId: string,
) {
  const root = rootNavigator(navigation);
  (root as { navigate: (n: string, p: { routeId: string }) => void }).navigate(screen, {
    routeId,
  });
}

export function navigateToDriverRouteDetail(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  navigateRootDriverRoute(navigation, "DriverRouteDetail", routeId);
}

export function navigateToDriverRouteConfirmMercancia(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  navigateRootDriverRoute(navigation, "DriverRouteConfirmMercancia", routeId);
}

export function navigateToDriverRouteProductPickup(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  navigateRootDriverRoute(navigation, "DriverRouteProductPickup", routeId);
}

export function navigateToDriverRouteNavFirstStop(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  navigateRootDriverRoute(navigation, "DriverRouteNavFirstStop", routeId);
}
