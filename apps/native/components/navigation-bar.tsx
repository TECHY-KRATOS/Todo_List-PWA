import React from "react";
import { Pressable, View } from "react-native";
import { IconButton, Surface, Text, Tooltip } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrawerActions } from "@react-navigation/native";
import { Link, useNavigation } from "expo-router";

import { SCREEN_HORIZONTAL_PADDING } from "@/constant/screens";

import { UserAvater } from "./user-avatar";

const TOP_PADDING = 10;

export default function NavigationBar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View
      style={{
        paddingTop: insets.top + TOP_PADDING,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left + SCREEN_HORIZONTAL_PADDING,
        paddingRight: insets.right + SCREEN_HORIZONTAL_PADDING
      }}
    >
      <Surface className="flex-row items-center rounded-full overflow-hidden flex">
        <View className="self-end">
          <Tooltip title="Open navigation drawer">
            <IconButton
              icon="menu"
              onPress={() => {
                navigation.dispatch(DrawerActions.toggleDrawer());
              }}
            />
          </Tooltip>
        </View>
        <Text className="flex-1">Search</Text>
        <Link asChild href="/../account">
          <Pressable>
            <View className="self-end">
              <UserAvater />
            </View>
          </Pressable>
        </Link>
      </Surface>
    </View>
  );
}
