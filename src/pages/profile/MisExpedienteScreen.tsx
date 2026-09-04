import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { ArrowRight2, FolderOpen, TickCircle } from "iconsax-react-native";
import Svg, { Line } from "react-native-svg";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { useFormColors, type FormColors } from "../../theme/formColors";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  getMyExpediente,
  type ExpedienteDocumentSummaryItemDto,
  type SellerExpedienteDto,
} from "../../services/workforceExpedienteService";

type Styles = ReturnType<typeof createStyles>;

type NodeKind = "done" | "pending" | "optional";

function fileCountLabel(count: number) {
  if (count === 0) return "Sin archivos";
  if (count === 1) return "1 archivo";
  return `${count} archivos`;
}

function formatUploadedAt(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function nodeKind(doc: ExpedienteDocumentSummaryItemDto): NodeKind {
  if (doc.fileCount > 0) return "done";
  if (doc.isRequired) return "pending";
  return "optional";
}

function stampLabel(doc: ExpedienteDocumentSummaryItemDto) {
  const when = formatUploadedAt(doc.uploadedAt);
  if (when) return when;
  if (doc.isRequired) return "Pendiente";
  return "Opcional";
}

function docCaption(doc: ExpedienteDocumentSummaryItemDto) {
  if (doc.fileCount === 0) {
    return doc.isRequired ? "Falta subir" : "Puedes subirlo después";
  }
  return fileCountLabel(doc.fileCount);
}

function headerSubtitle(data: SellerExpedienteDto | null, loading: boolean) {
  if (loading) return "Cargando tu expediente";
  if (!data) return "No se pudo cargar";
  if (data.isComplete) return "Tu expediente está completo";
  return `${data.requiredUploaded} de ${data.requiredTotal} obligatorios`;
}

const RAIL_W = 24;
const NODE_SIZE = 16;
const NODE_PAD = 16;
const FLIP_STAGGER_MS = 70;
const MAX_FLIP_DELAY_MS = 700;

function clampFlipDelay(delay: number) {
  return Math.min(delay, MAX_FLIP_DELAY_MS);
}

function TimelineNode({
  kind,
  styles,
  COLORS,
}: {
  kind: NodeKind;
  styles: Styles;
  COLORS: FormColors;
}) {
  if (kind === "done") {
    return (
      <View style={[styles.node, styles.nodeDone]}>
        <TickCircle size={11} color={COLORS.surface} variant="Bold" />
      </View>
    );
  }
  if (kind === "pending") {
    return <View style={[styles.node, styles.nodePending]} />;
  }
  return <View style={[styles.node, styles.nodeOptional]} />;
}

function ExpedienteSummary({
  data,
  styles,
  COLORS,
}: {
  data: SellerExpedienteDto;
  styles: Styles;
  COLORS: FormColors;
}) {
  const progress =
    data.requiredTotal > 0 ? data.requiredUploaded / data.requiredTotal : 1;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.iconSlot}>
          <FolderOpen size={22} color={COLORS.accent} variant="Linear" />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Estado del expediente</Text>
          <Text style={styles.summarySub}>
            Obligatorios {data.requiredUploaded}/{data.requiredTotal} · Opcionales{" "}
            {data.optionalUploaded}/{data.optionalTotal}
          </Text>
        </View>
        <Text
          style={[
            styles.summaryStatus,
            { color: data.isComplete ? COLORS.emerald : COLORS.accent },
          ]}
        >
          {data.isComplete ? "Completo" : "Pendiente"}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
              backgroundColor: data.isComplete ? COLORS.emerald : COLORS.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

function TimelineStep({
  doc,
  onPress,
  styles,
  COLORS,
}: {
  doc: ExpedienteDocumentSummaryItemDto;
  onPress: () => void;
  styles: Styles;
  COLORS: FormColors;
}) {
  const kind = nodeKind(doc);
  const done = kind === "done";
  const stamp = stampLabel(doc);
  const caption = docCaption(doc);

  return (
    <View style={styles.step}>
      <View style={styles.railCol}>
        <TimelineNode kind={kind} styles={styles} COLORS={COLORS} />
      </View>
      <View style={styles.eventWrap}>
        <SoftPressable
          onPress={onPress}
          scaleTo={0.99}
          accessibilityLabel={`${doc.documentTypeName}. ${
            doc.isRequired ? "Obligatorio" : "Opcional"
          }. ${caption}`}
        >
          <View
            style={[styles.eventCard, done ? styles.eventCardDone : null]}
          >
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {doc.documentTypeName}
              </Text>
              <Text style={styles.eventMeta} numberOfLines={1}>
                {doc.isRequired ? "Obligatorio" : "Opcional"}
                {" · "}
                {caption}
              </Text>
              <Text
                style={[
                  styles.eventStamp,
                  done ? styles.eventStampDone : null,
                ]}
              >
                {stamp}
              </Text>
            </View>
            <ArrowRight2 size={16} color={COLORS.muted} variant="Linear" />
          </View>
        </SoftPressable>
      </View>
    </View>
  );
}

function DocumentTimeline({
  documents,
  onOpen,
  revealDelay = 0,
  revealActive = true,
  styles,
  COLORS,
}: {
  documents: ExpedienteDocumentSummaryItemDto[];
  onOpen: (doc: ExpedienteDocumentSummaryItemDto) => void;
  revealDelay?: number;
  revealActive?: boolean;
  styles: Styles;
  COLORS: FormColors;
}) {
  const [height, setHeight] = useState(0);
  const [span, setSpan] = useState({ top: 0, bottom: 0 });
  const lastIndex = documents.length - 1;

  return (
    <View
      style={styles.timeline}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {height > 0 && lastIndex > 0 && span.bottom > span.top ? (
        <View pointerEvents="none" style={styles.railOverlay}>
          <Svg width={RAIL_W} height={height}>
            <Line
              x1={RAIL_W / 2}
              y1={span.top}
              x2={RAIL_W / 2}
              y2={span.bottom}
              stroke={COLORS.divider}
              strokeWidth={2}
              strokeDasharray="7 7"
              strokeLinecap="butt"
            />
          </Svg>
        </View>
      ) : null}
      {documents.map((doc, index) => (
        <View
          key={doc.documentTypeId}
          onLayout={(e) => {
            const center = e.nativeEvent.layout.y + NODE_PAD + NODE_SIZE / 2;
            if (index === 0) {
              setSpan((prev) =>
                prev.top === center ? prev : { ...prev, top: center },
              );
            }
            if (index === lastIndex) {
              setSpan((prev) =>
                prev.bottom === center ? prev : { ...prev, bottom: center },
              );
            }
          }}
        >
          <PageFlipReveal
            delay={clampFlipDelay(revealDelay + index * FLIP_STAGGER_MS)}
            active={revealActive}
          >
            <TimelineStep
              doc={doc}
              onPress={() => onOpen(doc)}
              styles={styles}
              COLORS={COLORS}
            />
          </PageFlipReveal>
        </View>
      ))}
    </View>
  );
}

export default function MisExpedienteScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const COLORS = useFormColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const [data, setData] = useState<SellerExpedienteDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getMyExpediente();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const openDocument = (doc: ExpedienteDocumentSummaryItemDto) => {
    navigation.navigate("MisExpedienteDocumento", {
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      isRequired: doc.isRequired,
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Mi expediente"
          subtitle={headerSubtitle(data, loading)}
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : !data ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>No se pudo cargar tu expediente.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            onScroll={onAutoTabBarScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_GUTTER,
              paddingTop: 8,
              paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.ink}
              />
            }
          >
            <PageFlipReveal delay={0} active={isFocused}>
              <ExpedienteSummary data={data} styles={styles} COLORS={COLORS} />
            </PageFlipReveal>
            <View style={styles.sectionBlock}>
              <PageFlipReveal delay={FLIP_STAGGER_MS} active={isFocused}>
                <Text style={styles.sectionTitle}>Línea de documentos</Text>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.emerald }]} />
                    <Text style={styles.legendText}>Subido</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: COLORS.accent }]}
                    />
                    <Text style={styles.legendText}>Pendiente</Text>
                  </View>
                </View>
              </PageFlipReveal>
              <DocumentTimeline
                documents={data.documents}
                onOpen={openDocument}
                revealDelay={FLIP_STAGGER_MS * 2}
                revealActive={isFocused}
                styles={styles}
                COLORS={COLORS}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function createStyles(COLORS: FormColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SCREEN_GUTTER,
    },
    scroll: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 15,
      fontWeight: "500",
      color: COLORS.muted,
      textAlign: "center",
    },
    summaryCard: {
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      gap: 12,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    iconSlot: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: COLORS.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryCopy: {
      flex: 1,
      minWidth: 0,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: "400",
      color: COLORS.ink,
    },
    summarySub: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: "500",
      color: COLORS.muted,
    },
    summaryStatus: {
      fontSize: 13,
      fontWeight: "600",
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: COLORS.divider,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    sectionBlock: {
      width: "100%",
      marginTop: 22,
    },
    sectionTitle: {
      marginLeft: 4,
      marginBottom: 10,
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.muted,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginLeft: 4,
      marginBottom: 14,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
      fontWeight: "600",
      color: COLORS.muted,
    },
    timeline: {
      width: "100%",
      position: "relative",
    },
    railOverlay: {
      position: "absolute",
      left: 0,
      top: 0,
      width: RAIL_W,
      bottom: 0,
    },
    step: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    railCol: {
      width: RAIL_W,
      alignItems: "center",
      paddingTop: NODE_PAD,
      zIndex: 1,
    },
    node: {
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    nodeDone: {
      backgroundColor: COLORS.emerald,
    },
    nodePending: {
      backgroundColor: COLORS.accent,
    },
    nodeOptional: {
      backgroundColor: COLORS.surface,
      borderWidth: 2,
      borderColor: COLORS.divider,
    },
    eventWrap: {
      flex: 1,
      minWidth: 0,
      paddingBottom: 12,
    },
    eventCard: {
      minHeight: 78,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },
    eventCardDone: {
      borderColor: COLORS.emeraldSoft,
    },
    eventCopy: {
      flex: 1,
      minWidth: 0,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: COLORS.ink,
    },
    eventMeta: {
      marginTop: 3,
      fontSize: 13,
      fontWeight: "500",
      color: COLORS.muted,
    },
    eventStamp: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.muted,
    },
    eventStampDone: {
      color: COLORS.emerald,
    },
  });
}
