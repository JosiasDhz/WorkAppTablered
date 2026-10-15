import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { SoftPressable } from "../../components/SoftPressable";
import { reviewPermissionCoverage } from "../../services/workforcePermissionRequestService";
import { refreshInAppUnreadCount } from "../../services/inAppUnreadBadge";
import { useNotificationColors } from "./notificationsTheme";

export type CoverageDecision = "approved" | "rejected" | "cancelled";

export function readCoverageDecision(
  payload: Record<string, unknown>,
): CoverageDecision | null {
  const value = payload.decision;
  return value === "approved" || value === "rejected" || value === "cancelled"
    ? value
    : null;
}

export function readCoverageId(payload: Record<string, unknown>): string {
  return typeof payload.coverageId === "string" ? payload.coverageId.trim() : "";
}

const DECISION_LABEL: Record<CoverageDecision, string> = {
  approved: "Cobertura aprobada. Se avisará al colaborador que cubre.",
  rejected: "Cobertura rechazada. El jefe que la propuso elegirá a otra persona.",
  cancelled: "Esta cobertura ya no está vigente.",
};

function apiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const data = error as Record<string, unknown>;
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0]);
    }
  }
  return "No se pudo completar la acción.";
}

export function CoverageReviewActions({
  coverageId,
  initialDecision,
}: {
  coverageId: string;
  initialDecision: CoverageDecision | null;
}) {
  const colors = useNotificationColors();
  const [decision, setDecision] = useState<CoverageDecision | null>(
    initialDecision,
  );
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (decision) {
    return (
      <Text
        style={[
          styles.resolvedLabel,
          { color: decision === "approved" ? colors.emerald : colors.rose },
        ]}
      >
        {DECISION_LABEL[decision]}
      </Text>
    );
  }

  const submit = async (next: "approve" | "reject") => {
    if (acting || !coverageId) return;
    const trimmed = reason.trim();
    if (next === "reject" && !trimmed) {
      Toast.show({ type: "error", text1: "Escribe el motivo del rechazo" });
      return;
    }
    setActing(next);
    try {
      await reviewPermissionCoverage(coverageId, {
        decision: next === "approve" ? "APPROVED" : "REJECTED",
        ...(next === "reject" ? { reason: trimmed } : {}),
      });
      Toast.show({
        type: "success",
        text1: next === "approve" ? "Cobertura aprobada" : "Cobertura rechazada",
      });
      setDecision(next === "approve" ? "approved" : "rejected");
      void refreshInAppUnreadCount();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "No se pudo completar",
        text2: apiErrorMessage(error),
      });
    } finally {
      setActing(null);
    }
  };

  return (
    <View style={styles.wrap}>
      {rejecting ? (
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo del rechazo"
          placeholderTextColor={colors.muted}
          multiline
          style={[
            styles.input,
            { color: colors.ink, borderColor: colors.roseSoft },
          ]}
          accessibilityLabel="Motivo del rechazo de la cobertura"
        />
      ) : null}
      <View style={styles.actions}>
        <SoftPressable
          onPress={() => {
            if (!rejecting) {
              setRejecting(true);
              return;
            }
            void submit("reject");
          }}
          disabled={Boolean(acting)}
          style={[styles.actionBtn, { backgroundColor: colors.roseSoft }]}
          accessibilityLabel="Rechazar cobertura"
        >
          {acting === "reject" ? (
            <ActivityIndicator color={colors.rose} />
          ) : (
            <Text style={[styles.rejectLabel, { color: colors.rose }]}>
              {rejecting ? "Confirmar rechazo" : "Rechazar"}
            </Text>
          )}
        </SoftPressable>
        <SoftPressable
          onPress={() => void submit("approve")}
          disabled={Boolean(acting) || rejecting}
          style={[
            styles.actionBtn,
            { backgroundColor: colors.accent, opacity: rejecting ? 0.5 : 1 },
          ]}
          accessibilityLabel="Aprobar cobertura"
        >
          {acting === "approve" ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.approveLabel}>Aprobar</Text>
          )}
        </SoftPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    width: "100%",
    gap: 10,
  },
  input: {
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  rejectLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  approveLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resolvedLabel: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
