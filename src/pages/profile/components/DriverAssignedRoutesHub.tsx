import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { navigateToDriverRouteDetail } from "../../../routes/navigateDriverRoutesFromProfileTab";
import {
  Box1,
  Calendar1,
  Car,
  Logout,
  Truck,
} from "iconsax-react-native";
import { driverRouteStatusLabelEs } from "../../../domain/driverRoutePending";
import type { DriverAssignedRouteRecord } from "../../../services/driverRoutesService";
import type { UseDriverPendingRoutesResult } from "../hooks/useDriverPendingRoutes";

type DriverAssignedRoutesHubProps = {
  userName: string;
  avatarSource: ImageSourcePropType;
  onLogout: () => void;
  routes: UseDriverPendingRoutesResult;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

function formatRouteWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function statusAccent(status: string): string {
  if (status === "EN_PROCESO") return "#EA580C";
  if (status === "CONFIRMADA") return "#16A34A";
  if (status === "GUARDADA") return "#64748B";
  return "#94A3B8";
}

function RouteTicket({
  item,
  onPress,
}: {
  item: DriverAssignedRouteRecord;
  onPress: () => void;
}) {
  const accent = statusAccent(item.status);
  const vehicle = item.assignedVehiclesSummary?.trim();
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={ticketStyles.wrap}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ruta ${item.folio}`}
    >
      <View style={[ticketStyles.accent, { backgroundColor: accent }]} />
      <View style={ticketStyles.body}>
        <View style={ticketStyles.topRow}>
          <Text style={ticketStyles.folio}>{item.folio}</Text>
          <View style={[ticketStyles.badge, { borderColor: accent }]}>
            <Text style={[ticketStyles.badgeTxt, { color: accent }]}>
              {driverRouteStatusLabelEs(item.status)}
            </Text>
          </View>
        </View>
        <Text style={ticketStyles.warehouse}>{item.originWarehouseName}</Text>
        <View style={ticketStyles.metaRow}>
          <View style={ticketStyles.metaItem}>
            <Calendar1 size={15} color="#64748B" variant="Linear" />
            <Text style={ticketStyles.metaTxt}>{formatRouteWhen(item.createdAtCdmx)}</Text>
          </View>
          {item.assignedTotalUnits > 0 ? (
            <View style={ticketStyles.metaItem}>
              <Box1 size={15} color="#64748B" variant="Linear" />
              <Text style={ticketStyles.metaTxt}>{item.assignedTotalUnits} uds.</Text>
            </View>
          ) : null}
        </View>
        {item.assignedDestinationsCount > 0 ? (
          <Text style={ticketStyles.stops}>
            {item.assignedDestinationsCount}{" "}
            {item.assignedDestinationsCount === 1 ? "parada" : "paradas"} en tu ruta
          </Text>
        ) : null}
        {vehicle ? (
          <View style={ticketStyles.vehicleRow}>
            <Car size={15} color="#0F172A" variant="Linear" />
            <Text style={ticketStyles.vehicleTxt} numberOfLines={1}>
              {vehicle}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const ticketStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  accent: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  folio: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#0F172A",
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: "700",
  },
  warehouse: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  stops: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  vehicleRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  vehicleTxt: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
});

const C = {
  canvas: "#E8EDF5",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  orange: "#EA7600",
  white: "#FFFFFF",
  headerTint: "#1E293B",
};

export function DriverAssignedRoutesHub({
  userName,
  avatarSource,
  onLogout,
  routes,
  onScroll,
}: DriverAssignedRoutesHubProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const inProcess = useMemo(
    () => routes.items.filter((r) => r.status === "EN_PROCESO").length,
    [routes.items],
  );
  const totalStops = useMemo(
    () => routes.items.reduce((s, r) => s + (r.assignedDestinationsCount || 0), 0),
    [routes.items],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={routes.loading && routes.items.length > 0}
            onRefresh={() => void routes.refresh()}
            tintColor={C.orange}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingBottom: Math.max(tabBarHeight, 120) + 28,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.topBand}>
          <View style={styles.topBandInner}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Operaciones</Text>
              <Text style={styles.title}>Mis rutas</Text>
              <Text style={styles.sub} numberOfLines={1}>
                Hola, {userName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onLogout}
              style={styles.logoutBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              <Logout size={22} color={C.white} variant="Linear" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{routes.items.length}</Text>
            <Text style={styles.statLbl}>Pendientes</Text>
          </View>
          <View style={[styles.statCell, styles.statCellMid]}>
            <Text style={[styles.statNum, { color: C.orange }]}>{inProcess}</Text>
            <Text style={styles.statLbl}>En ruta</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{totalStops}</Text>
            <Text style={styles.statLbl}>Paradas</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Asignadas para ti</Text>
        </View>

        {routes.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{routes.error}</Text>
            <TouchableOpacity
              style={styles.retry}
              onPress={() => void routes.refresh()}
              activeOpacity={0.85}
            >
              <Text style={styles.retryTxt}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!routes.error && routes.loading && routes.items.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={C.orange} />
          </View>
        ) : null}

        {!routes.error && !routes.loading && routes.items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Truck size={40} color={C.muted} variant="Linear" />
            </View>
            <Text style={styles.emptyTitle}>Sin rutas por ahora</Text>
            <Text style={styles.emptySub}>
              Cuando te asignen una ruta de entrega, verás el folio, paradas y vehículo aquí.
            </Text>
          </View>
        ) : null}

        {!routes.error
          ? routes.items.map((item) => (
              <RouteTicket
                key={item.id}
                item={item}
                onPress={() => navigateToDriverRouteDetail(navigation, item.id)}
              />
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  topBand: {
    backgroundColor: C.headerTint,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  topBandInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  kicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 2,
    color: C.white,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 4,
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 22,
    gap: 10,
  },
  statCell: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  statCellMid: {
    borderColor: "rgba(234, 118, 0, 0.35)",
  },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink,
  },
  statLbl: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionBar: {
    width: 4,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.orange,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600",
  },
  retry: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: C.orange,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryTxt: {
    color: C.white,
    fontWeight: "800",
    fontSize: 14,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
    textAlign: "center",
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});
