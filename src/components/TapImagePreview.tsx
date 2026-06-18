import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseCircle } from "iconsax-react-native";

type TapImagePreviewProps = {
  uri: string;
  enabled?: boolean;
  headers?: Record<string, string>;
  children: React.ReactNode;
};

export function TapImagePreview({
  uri,
  enabled = true,
  headers,
  children,
}: TapImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const { width: ww, height: wh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const close = useCallback(() => setOpen(false), []);
  const trimmed = uri && String(uri).trim();
  const canOpen = Boolean(enabled && trimmed);
  const imageSource = useMemo((): ImageSourcePropType | null => {
    if (!trimmed) return null;
    return headers ? { uri: String(trimmed), headers } : { uri: String(trimmed) };
  }, [headers, trimmed]);

  useEffect(() => {
    if (!open) return;
    StatusBar.setBarStyle("light-content");
    return () => {
      StatusBar.setBarStyle("dark-content");
    };
  }, [open]);

  return (
    <>
      <Pressable
        disabled={!canOpen}
        onPress={() => canOpen && setOpen(true)}
        style={({ pressed }) => [
          styles.thumbPressable,
          pressed && canOpen ? styles.thumbPressed : undefined,
        ]}
      >
        {children}
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View
            style={[styles.modalCenter, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 24 }]}
            pointerEvents="box-none"
          >
            {imageSource ? (
              <Image
                source={imageSource}
                style={{
                  width: ww - 32,
                  height: Math.min(
                    wh * 0.72,
                    wh - insets.top - insets.bottom - 72,
                  ),
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <Pressable
            style={[styles.closeFab, { top: insets.top + 10, right: 16 + Math.max(insets.right, 0) }]}
            onPress={close}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Cerrar vista"
          >
            <CloseCircle size={30} color="#FFFFFF" variant="Bold" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbPressable: {
    alignSelf: "flex-start",
  },
  thumbPressed: {
    opacity: 0.92,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
  },
  modalCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  closeFab: {
    position: "absolute",
    zIndex: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
});
