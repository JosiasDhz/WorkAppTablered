import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { ShieldTick } from "iconsax-react-native";
import { SoftReveal } from "../../../components/SoftPressable";
import { isWorkerDriver } from "../../../auth/isWorkerDriver";
import { RootState } from "../../../redux/store/store";
import { useDriverPendingRoutes } from "../../profile/hooks/useDriverPendingRoutes";
import { useHomeRevealActive } from "../HomeRevealActiveContext";
import { HOME_COLORS } from "../homeTheme";
import { buildDriverRoleHomeKpi } from "./buildDriverRoleHomeKpi";
import { formatImssEnrolledDate } from "./formatImssEnrolledDate";
import { HomeAttendanceKpi } from "./HomeAttendanceKpi";
import {
  HomeExpedienteKpiRing,
  HomeExpedienteKpiTitle,
} from "./HomeExpedienteKpi";
import { HomeKpiCard, type HomeKpiTone } from "./HomeKpiCard";
import { HomeShortcutCards } from "./HomeShortcutCards";
import { HomeRoleKpi } from "./HomeRoleKpi";
import { useWorkerHomeKpis } from "./useWorkerHomeKpis";

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

  const imss = useMemo(() => {
    if (loading) {
      return {
        status: "Cargando",
        caption: "Consultando tu alta IMSS",
        tone: "neutral" as HomeKpiTone,
      };
    }
    if (!data) {
      return {
        status: "No disponible",
        caption: "Intenta de nuevo más tarde",
        tone: "neutral" as HomeKpiTone,
      };
    }
    if (!data.imss.isEnrolled) {
      return {
        status: "Sin alta",
        caption: "Aún no estás dado de alta",
        tone: "pending" as HomeKpiTone,
      };
    }
    const enrolledLabel = formatImssEnrolledDate(data.imss.enrolledAt);
    return {
      status: "Dado de alta",
      caption: enrolledLabel ? `Alta ${enrolledLabel}` : "Alta registrada",
      tone: "ok" as HomeKpiTone,
    };
  }, [data, loading]);

  const attendance = data?.attendance ?? null;

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
        <View style={styles.leftCol}>
          <SoftReveal delay={100} active={revealActive}>
            <HomeAttendanceKpi
              attendance={attendance}
              loading={loading}
              onPress={openQr}
            />
          </SoftReveal>
          <SoftReveal delay={160} active={revealActive}>
            <HomeExpedienteKpiTitle
              status={expediente.status}
              caption={expediente.caption}
              tone={expediente.tone}
              onPress={openExpediente}
            />
          </SoftReveal>
        </View>
        <View style={styles.rightCol}>
          <SoftReveal delay={130} active={revealActive}>
            <HomeKpiCard
              title="IMSS"
              status={imss.status}
              caption={imss.caption}
              tone={imss.tone}
              accessibilityLabel={`IMSS ${imss.status}. ${imss.caption}`}
              icon={
                <ShieldTick
                  size={18}
                  color={
                    imss.tone === "ok"
                      ? HOME_COLORS.positive
                      : imss.tone === "pending"
                        ? HOME_COLORS.warning
                        : HOME_COLORS.accent
                  }
                  variant="Linear"
                />
              }
            />
          </SoftReveal>
          <SoftReveal delay={190} active={revealActive}>
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
      </View>
      <HomeShortcutCards />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  leftCol: {
    flex: 1,
    gap: 10,
    overflow: "visible",
  },
  rightCol: {
    flex: 1,
    gap: 10,
  },
});
