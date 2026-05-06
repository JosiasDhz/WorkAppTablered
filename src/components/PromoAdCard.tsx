import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

type PromoAdCardProps = {
  imageSource: ImageSourcePropType;
  onPress?: () => void;
  badgeText?: string;
  title?: string;
  ctaText?: string;
};

const { width: screenWidth } = Dimensions.get("window");
const CARD_MAX_WIDTH = 420;
const horizontalPadding = 16;
const cardWidth = Math.min(screenWidth - horizontalPadding * 2, CARD_MAX_WIDTH);

export function PromoAdCard({
  imageSource,
  onPress,
  badgeText = "Promo especial",
  title = "Compra hoy\ny ahorra",
  ctaText = "Comprar",
}: PromoAdCardProps) {
  return (
    <View style={[styles.wrapper, { width: cardWidth }]}>
      <View style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.leftContent}>
            <Text style={styles.badge}>{badgeText}</Text>

            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.ctaButton}>
              <Text style={styles.ctaText}>{ctaText}</Text>
              <View style={styles.ctaIconWrap}>
                <AntDesign name="arrowright" size={12} color="#111827" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.imageWrap}>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            <View style={styles.imageTopTag}>
              <Text style={styles.imageTopTagText}>Optimizador de{"\n"}CORTE ONLINE</Text>
            </View>
          </View>
        </View>

        <View style={styles.slotCutout} pointerEvents="none">
          <View style={styles.dotsWrap}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
  },
  card: {
    height: 190,
    borderRadius: 25,
    backgroundColor: "#e47911",
    overflow: "hidden",
    padding: 14,
    position: "relative",
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftContent: {
    width: "56%",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34 / 2,
    lineHeight: 42 / 2,
    fontWeight: "900",
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 7,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 15 / 1.1,
    fontWeight: "800",
  },
  ctaIconWrap: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    width: "46%",
    height: "85%",
    alignSelf: "flex-end",
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageTopTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(17, 24, 39, 0.78)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageTopTagText: {
    color: "#F59E0B",
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: "700",
  },
  slotCutout: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -44,
    width: 88,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dotsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  activeDot: {
    width: 18,
    backgroundColor: "#e47911",
  },
});

