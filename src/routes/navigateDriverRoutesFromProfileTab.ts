import type { NavigationProp, ParamListBase } from "@react-navigation/native";

function rootNavigator(navigation: NavigationProp<ParamListBase>) {
  return navigation.getParent()?.getParent() as
    | NavigationProp<ParamListBase>
    | undefined;
}

export function navigateToDriverRouteDetail(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  const root = rootNavigator(navigation);
  (root as { navigate: (n: string, p: { routeId: string }) => void } | undefined)?.navigate?.(
    "DriverRouteDetail",
    { routeId },
  );
}

export function navigateToDriverRouteProductPickup(
  navigation: NavigationProp<ParamListBase>,
  routeId: string,
) {
  const root = rootNavigator(navigation);
  (root as { navigate: (n: string, p: { routeId: string }) => void } | undefined)?.navigate?.(
    "DriverRouteProductPickup",
    { routeId },
  );
}
