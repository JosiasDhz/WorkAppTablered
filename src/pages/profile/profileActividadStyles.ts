import { Platform, StyleSheet } from "react-native";

export const profileActividadStyles = StyleSheet.create({
  screenPad: {
    paddingHorizontal: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: 14,
    overflow: "hidden",
  },
  heroGlowOne: {
    position: "absolute",
    right: -60,
    top: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  heroGlowTwo: {
    position: "absolute",
    left: -80,
    bottom: -100,
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFFFFF88",
  },
  heroCaption: {
    color: "#B6E1D7",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroUserName: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  heroIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#2A716A",
    backgroundColor: "#0B4C45",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  balanceTrend: {
    fontSize: 14,
    fontWeight: "700",
  },
  balanceValue: {
    marginTop: 2,
    color: "#F8FCFB",
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  balanceLabel: {
    marginTop: 1,
    color: "#B6D5CF",
    fontSize: 12,
    fontWeight: "500",
  },
  heroPillsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  heroPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2D746D",
    backgroundColor: "#0A4842",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: {
    color: "#D1EEE7",
    fontSize: 12,
    fontWeight: "600",
  },
  sheet: {
    marginTop: -18,
    borderRadius: 24,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.6)"
        : "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    padding: 14,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 29 / 1.35,
    fontWeight: "700",
  },
  sheetCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterWrap: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  filterButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFEFC",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF5ED",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 19 / 1.3,
    fontWeight: "700",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowPoints: {
    fontSize: 24 / 1.4,
    fontWeight: "700",
  },
  rowDate: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  driverStatusChip: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  driverStatusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  centerBox: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
