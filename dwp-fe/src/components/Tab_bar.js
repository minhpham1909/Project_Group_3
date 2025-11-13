import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { COLORS, FONTS, SPACING } from "../utils/constant";

const getNavItems = (role) => {
  const commonItems = [
    { name: "HomeTab", icon: "home-outline" },
    { name: "ChatBot", icon: "chatbubble-outline" },
    { name: "Profile", icon: "person-outline" }
  ];

  const roleSpecificItems = {
    1: [
      { name: "Analysis", icon: "document-text-outline" },
      { name: "Map", icon: "map-outline" },
    
    ],
    2: [
      { name: "MyStore", icon: "storefront-outline" },
      { name: "OrderStore", icon: "receipt-outline" }
    ],
    3: [
      { name: "Censor", icon: "create-outline" },
      { name: "CheckList", icon: "checkmark-circle-outline" }
    ],
  };

  return [...(roleSpecificItems[role] || []), ...commonItems];
};

const TabBarComponent = ({ state, descriptors, navigation }) => {
  const role = useSelector((state) => state.auth.user?.role);
  const navItems = getNavItems(role);

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const navItem = navItems.find(
          (item) => item.name.toLowerCase() === route.name.toLowerCase()
        );
        if (!navItem) return null;

        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
              <Ionicons
                name={isFocused ? navItem.icon.replace("-outline", "") : navItem.icon}
                size={24}
                color={isFocused ? COLORS.PRIMARY : COLORS.GRAY}
              />
            </View>
            <Text
              style={[
                styles.text,
                { color: isFocused ? COLORS.PRIMARY : COLORS.GRAY },
                isFocused && styles.textFocused,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    paddingTop: SPACING.SMALL,
    paddingBottom: SPACING.SMALL,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.TINY,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.TINY,
  },
  iconContainerFocused: {
    backgroundColor: `${COLORS.PRIMARY}15`,
  },
  text: {
    fontSize: FONTS.TINY,
    fontWeight: "500",
    marginTop: 2,
  },
  textFocused: {
    fontWeight: "bold",
  },
});

export default TabBarComponent;
