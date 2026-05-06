import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { LOGIN_COLORS, LOGIN_COPY, LOGO_SIZE } from "./constants";

type Props = {
  logoSource: ImageSourcePropType;
};

export function LoginWelcomeHeader({ logoSource }: Props) {
  return (
    <View className="flex-row items-center">
      <Image
        source={logoSource}
        style={{
          width: LOGO_SIZE.width,
          height: LOGO_SIZE.height,
          marginRight: LOGO_SIZE.marginRight,
        }}
        resizeMode="contain"
      />
      <View className="flex-1">
        <Text
          className="text-[30px] font-bold tracking-tight"
          style={{ color: LOGIN_COLORS.black }}
        >
          {LOGIN_COPY.title}
        </Text>
        <View
          className="h-[3px] rounded-full mt-2.5 self-start"
          style={{ width: 48, backgroundColor: LOGIN_COLORS.orange }}
        />
      </View>
    </View>
  );
}
