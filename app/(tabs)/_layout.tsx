import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { useOrg } from "@/lib/org-context";

export default function TabLayout() {
  const { org } = useOrg();
  const { lang } = useLanguage();
  const hasOrg = !!org;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5B7553",
        tabBarInactiveTintColor: "#A3A89E",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "rgba(0,0,0,0.06)",
        },
        headerShown: false,
        sceneStyle: { backgroundColor: "#F9F7F4" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab_home", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t("tab_tasks", lang),
          href: hasOrg ? "/(tabs)/tasks" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tab_calendar", lang),
          href: hasOrg ? "/(tabs)/calendar" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: t("tab_game", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab_profile", lang),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
