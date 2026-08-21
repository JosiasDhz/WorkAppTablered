import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { SoftReveal } from "../../../components/SoftPressable";
import { isWorkerDriver } from "../../../auth/isWorkerDriver";
import { RootState } from "../../../redux/store/store";
import { useDriverPendingRoutes } from "../../profile/hooks/useDriverPendingRoutes";
import { useHomeRevealActive } from "../HomeRevealActiveContext";
import { buildDriverRoleHomeKpi } from "./buildDriverRoleHomeKpi";
import {
  HomeExpedienteKpiRing,
  HomeExpedienteKpiTitle,
} from "./HomeExpedienteKpi";
import { HomeShortcutCards } from "./HomeShortcutCards";
import { HomeRoleKpi } from "./HomeRoleKpi";
import { HomeAttendanceKpi } from "./HomeAttendanceKpi";
import { HomeSideSlotCard } from "./HomeSideSlotCard";
import { useWorkerHomeKpis } from "./useWorkerHomeKpis";
import type { HomeKpiTone } from "./HomeKpiCard";

function expedienteCaption(uploaded: number, total: number): string {
  if (total === 0) return "Sin documentos obligatorios";
  return `${uploaded} de ${total} documentos`;
}

export function HomeStatusKpis() {
  const navigation = useNavigation<any>();
  const revealActive = useHomeRevealActive();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, loading } = useWorkerHomeKpis();
  const isDriver = isWorkerDriver(user);
  const needLocalDriverKpi = isDriver && !loading && !data?.roleKpi;
  const driverRoutes = useDriverPendingRoutes(needLocalDriverKpi);

  const roleKpi = useMemo(() => {
    if (data?.roleKpi) return data.roleKpi;
    if (!needLocalDriverKpi) return null;
    if (driverRoutes.loading && driverRoutes.items.length === 0) return null;
    return buildDriverRoleHomeKpi(driverRoutes.items);
  }, [
    data?.roleKpi,
    driverRoutes.items,
    driverRoutes.loading,
    needLocalDriverKpi,
  ]);

  const openQr = () => {
    const tabs = navigation.getParent();
    if (tabs) {
      tabs.navigate("CheckInStack");
    } else {
      navigation.navigate("CheckInStack");
    }
  };

  const openExpediente = () => {
    navigation.navigate("MisExpediente");
  };

  const openCommissions = () => {
    const tabs = navigation.getParent();
    if (tabs) {
      tabs.navigate("UserProfileStack", { screen: "MisComisiones" });
      return;
    }
    navigation.navigate("UserProfileStack", { screen: "MisComisiones" });
  };

  const openRoleKpi = () => {
    const action = roleKpi?.action;
    if (action === "routes") {
      navigation.navigate("DriverRoutesHub");
      return;
    }
    if (action !== "inventory") return;
    let current = navigation;
    while (current?.getParent?.()) {
      current = current.getParent();
    }
    current.navigate("Inventory");
  };

  const expediente = useMemo(() => {
    if (loading) {
      return {
        status: "Cargando",
        caption: "Consultando tu expediente",
        tone: "neutral" as HomeKpiTone,
        progress: 0,
        percentLabel: "—",
      };
    }
    if (!data) {
      return {
        status: "No disponible",
        caption: "Intenta de nuevo más tarde",
        tone: "neutral" as HomeKpiTone,
        progress: 0,
        percentLabel: "—",
      };
    }

    const uploaded = data.expediente.requiredUploaded;
    const total = data.expediente.requiredTotal;
    const progress = total === 0 ? 1 : uploaded / total;

    return {
      status: data.expediente.isComplete ? "Completo" : "Pendiente",
      caption: expedienteCaption(uploaded, total),
      tone: (data.expediente.isComplete ? "ok" : "pending") as HomeKpiTone,
      progress,
      percentLabel: `${Math.round(progress * 100)}%`,
    };
  }, [data, loading]);

  const attendance = data?.attendance ?? null;
  const commission = data?.commission ?? null;
  const sideRoleKpi =
    commission?.programActive === true ? null : roleKpi;

  return (
    <View style={styles.board}>
      {roleKpi ? (
        <SoftReveal delay={40} active={revealActive}>
          <HomeRoleKpi
            kpi={roleKpi}
            onPress={
              roleKpi.action === "inventory" || roleKpi.action === "routes"
                ? openRoleKpi
                : undefined
            }
          />
        </SoftReveal>
      ) : null}
      <View style={styles.row}>
        <SoftReveal delay={100} active={revealActive} style={styles.cell}>
          <HomeAttendanceKpi
            attendance={attendance}
            loading={loading}
            onPress={openQr}
          />
        </SoftReveal>
        <SoftReveal delay={130} active={revealActive} style={styles.cell}>
          <HomeSideSlotCard
            loading={loading}
            commission={commission}
            roleKpi={sideRoleKpi}
            onPressCommission={openCommissions}
            onPressRole={
              roleKpi?.action === "inventory" || roleKpi?.action === "routes"
                ? openRoleKpi
                : undefined
            }
          />
        </SoftReveal>
      </View>
      <View style={styles.expedienteRow}>
        <SoftReveal delay={160} active={revealActive} style={styles.expedienteTitleCell}>
          <HomeExpedienteKpiTitle
            status={expediente.status}
            caption={expediente.caption}
            tone={expediente.tone}
            onPress={openExpediente}
          />
        </SoftReveal>
        <SoftReveal delay={190} active={revealActive} style={styles.expedienteRingCell}>
          <HomeExpedienteKpiRing
            status={expediente.status}
            caption={expediente.caption}
            tone={expediente.tone}
            progress={expediente.progress}
            percentLabel={expediente.percentLabel}
            onPress={openExpediente}
          />
        </SoftReveal>
      </View>
      <HomeShortcutCards />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    gap: 10,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  cell: {
    flex: 1,
  },
  expedienteRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  expedienteTitleCell: {
    flex: 1,
    zIndex: 1,
  },
  expedienteRingCell: {
    flex: 1,
  },
});
