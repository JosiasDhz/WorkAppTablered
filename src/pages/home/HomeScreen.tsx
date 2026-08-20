import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import { HeaderAvatar } from "../../components/HeaderAvatar";
import { HeaderTitle } from "../../components/HeaderTitle";
import { PageFlipReveal } from "../../components/PageFlipReveal";
import { SoftReveal } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import { HomeRevealActiveProvider } from "./HomeRevealActiveContext";
import { HOME_SECTIONS } from "./homeSections";
import { HOME_COLORS } from "./homeTheme";
import { consumeHomeWelcomePending } from "./homeWelcomePending";
import { HomeWelcomeSplash } from "./HomeWelcomeSplash";
import { useHomeIdentity } from "./useHomeIdentity";

const SECTION_REVEAL_STEP_MS = 90;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const { firstName, roleLabel, welcomeHeadline } = useHomeIdentity();
  const [showWelcome] = useState(() => consumeHomeWelcomePending());
  const [welcomeDone, setWelcomeDone] = useState(!showWelcome);

  const onWelcomeFinished = useCallback(() => {
    setWelcomeDone(true);
  }, []);

  const cardsActive = welcomeDone && isFocused;

  const revealDelays = useMemo(
    () => HOME_SECTIONS.map((_, index) => index * SECTION_REVEAL_STEP_MS),
    [],
  );

  return (
    <View style={styles.root}>
      <HomeRevealActiveProvider active={cardsActive}>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <SoftReveal delay={0} active={cardsActive}>
            <HeaderTitle
              title={`Hola, ${firstName}`}
              subtitle={roleLabel}
              tone="light"
              style={styles.header}
              titleColor={HOME_COLORS.heading}
              leadingAccessory={<HeaderAvatar size={52} />}
            />
          </SoftReveal>
          <ScrollView
            onScroll={onAutoTabBarScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(tabBarHeight, insets.bottom) + 24,
              },
            ]}
          >
            {HOME_SECTIONS.map((section, index) => (
              <PageFlipReveal
                key={section.id}
                delay={revealDelays[index] ?? 0}
                active={cardsActive}
                style={index === 0 ? styles.firstBlock : styles.block}
              >
                <View>{section.render()}</View>
              </PageFlipReveal>
            ))}
          </ScrollView>
        </SafeAreaView>
      </HomeRevealActiveProvider>
      {showWelcome && !welcomeDone ? (
        <HomeWelcomeSplash
          headline={welcomeHeadline}
          onFinished={onWelcomeFinished}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
  },
  firstBlock: {
    width: "100%",
    marginTop: 4,
  },
  block: {
    width: "100%",
    marginTop: 18,
  },
});
