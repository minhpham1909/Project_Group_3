import React from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Tab_bar from "../components/Tab_bar";
import SigninScreen from "../screens/Login";
import HomePage from "../screens/HomePage";
import ProfileStack from "../screens/Profile";
import MapView from "../screens/MapView";
import CartScreen from "../screens/Cart";
import MyStore from "../screens/MyStore";
import Censor from "../screens/Censor";
import OrderStore from "../screens/OrderStore";
import CheckList from "../screens/CheckList";
import ChatBot from "../screens/ChatBot";
import CreateOrder from "../screens/CreateOrder";
import EditStore from "../screens/EditStore";
import CreateStore from "../screens/CreateStore";
import Notification from "../screens/Notification";
import SupplierNotification from "../screens/SupplierNotification";
import Test from "../screens/Test";
import RegisterScreen from "../screens/RegisterScreen";
import ProductDetail from "../screens/ProductDetail";
import RequestOrder from "../screens/RequestOrder";
import OrderDetail from "../screens/OrderDetail";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { COLORS, ROUTER } from "../utils/constant";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// HomeStack (giữ nguyên)
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomePage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notification"
        component={Notification}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RequestOrder"
        component={RequestOrder}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrder}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupplierNotification"
        component={SupplierNotification}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main Tab (giữ nguyên)
function Main() {
  const user = useSelector((state) => state.auth.user); // Lấy full user
  const role = user?.role;

  // ✅ THÊM GUARD: Nếu user null → không render Main, fallback
  if (!user) {
    return <Text>Loading...</Text>; // Hoặc navigate back to Login via dispatch(logout())
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <Tab_bar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {role === 1 && (
        <>
          <Tab.Screen name="Analysis" component={Test} />
          {/* <Tab.Screen name="Map" component={MapView} /> */}
        </>
      )}

      {role === 2 && (
        <>
          <Tab.Screen name="MyStore" component={MyStore} />
          <Tab.Screen name="OrderStore" component={OrderStore} />
        </>
      )}
      {role === 3 && (
        <>
          {/* <Tab.Screen name="Censor" component={Censor} /> */}
          <Tab.Screen name="CheckList" component={CheckList} />
        </>
      )}

      <Tab.Screen
        screenOptions={{ headerShown: false }}
        name="HomeTab"
        component={HomeStack}
      />
      <Tab.Screen name="ChatBot" component={ChatBot} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.auth.user?.role); // Lấy role cho conditional
  const navigation = useNavigation();

  useEffect(() => {
    if (isLoggedIn) {
      navigation.navigate("HomeTab");
    }
  }, [isLoggedIn, navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={SigninScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={Main} />
          {role === 2 && ( // Chỉ supplier (role 2) mới edit store
            <Stack.Screen
              name="EditStore"
              component={EditStore} // ← Component tồn tại (imported ở đầu)
              options={{
                title: "Chỉnh sửa cửa hàng",
                headerTintColor: COLORS.PRIMARY,
                headerBackTitle: "Quay lại",
                headerStyle: { backgroundColor: COLORS.PRIMARY },
              }}
            />
          )}
          {role === 2 && ( // Chỉ supplier (role 2) mới tạo cửa hàng
            <Stack.Screen
              name="CreateStore"
              component={CreateStore} // ← Component tồn tại (imported ở đầu)
              options={{
                title: "Tạo cửa hàng",
                headerTintColor: "#000000",
                headerBackTitle: "Quay lại",
                headerStyle: { backgroundColor: "#FFFFFF" },
              }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
});

export default RootNavigator;
