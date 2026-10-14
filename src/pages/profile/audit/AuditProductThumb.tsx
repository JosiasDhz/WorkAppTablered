import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Box } from "iconsax-react-native";
import { apiBaseUrl } from "../../../api/http-common";
import { createThemedStyles } from "../../../theme/themedStyles";
import { useAuditUi, type AuditUi } from "./auditUi";

const THUMB_SIZE = 56;

function productThumbUrl(fileId: string): string {
  return `${apiBaseUrl}/files/${fileId}/process?width=${THUMB_SIZE * 3}&quality=75&format=webp`;
}

export function AuditProductThumb({ fileId }: { fileId?: string | null }) {
  const ui = useAuditUi();
  const styles = useThumbStyles();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(fileId && apiBaseUrl) && !failed;

  return (
    <View style={styles.frame}>
      {showImage ? (
        <Image
          source={{ uri: productThumbUrl(fileId as string) }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Box size={22} color={ui.muted} variant="Linear" />
      )}
    </View>
  );
}

function buildThumbStyles(ui: AuditUi) {
  return StyleSheet.create({
    frame: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: ui.field,
      alignItems: "center",
      justifyContent: "center",
    },
    image: { width: "100%", height: "100%" },
  });
}

const useThumbStyles = createThemedStyles(useAuditUi, buildThumbStyles);
