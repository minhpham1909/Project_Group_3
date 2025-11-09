import React from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Tab_bar from "../components/Tab_bar";
// import Booking_screen from "../screens/Booking_screen";
// import Explore_screen from "../screens/Explore_screen";
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
// import FieldDetailScreen from "../screens/FieldDetailScreen";
// import FieldListScreen from "../screens/FieldListScreen";
// import FieldAdminDetailScreen from "../screens/FieldAdminsDetail";
// import Header from "../layout/Header";
// import ManageAccount from "../screens/ManageAccount";
// import AccountDetail from "../screens/AccountDetail";
// import Dashboard from "../screens/Dashboard";
import { ROUTER } from "../utils/constant";
// import RentalEquipmentScreen from "../screens/RentalEquipmentScreen";
// import EquipmentDetailScreen from "../screens/EquipmentDetailsScreen";
// import TabScreen from "../components/Tab_Navigator";
// import SportSelected from "../screens/SportSelected";
import Notification from "../screens/Notification";
import SupplierNotification from "../screens/SupplierNotification";
import Test from "../screens/Test";
import RegisterScreen from "../screens/RegisterScreen";
import ProductDetail from "../screens/ProductDetail";
// import ServiceOrderSchedule from "../screens/ServiceOrder";
import RequestOrder from "../screens/RequestOrder";
import { useSelector } from "react-redux";
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
// import EquipmentListScreen from "../screens/EquipmentList";
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Đạt
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={HomePage} 
        options={{ headerShown: false }} // Tắt header cho HomePage
      />
      <Stack.Screen name="Notification" component={Notification} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RequestOrder" component={RequestOrder} options={{ headerShown: false }} />
      <Stack.Screen name="CreateOrder" component={CreateOrder} options={{ headerShown: false }} />
      <Stack.Screen name="SupplierNotification" component={SupplierNotification} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}


function Main() {
  const role = useSelector((state) => state.auth.user?.role);
  
  return (
    <Tab.Navigator
      tabBar={(props) => <Tab_bar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {role === 1 && (
        <>
          {/* <Tab.Screen name="Test" component={Test} />
          <Tab.Screen name="Map" component={MapView} /> */}
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
          <Tab.Screen name="Censor" component={Censor} />
          <Tab.Screen name="CheckList" component={CheckList} />
        </>
      )}

      {/* Đổi tên từ "Home" thành "HomeTab" để tránh xung đột */}
      <Tab.Screen screenOptions={{ headerShown: false }} name="HomeTab" component={HomeStack} />
      <Tab.Screen name="ChatBot" component={ChatBot} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigation = useNavigation();

  useEffect(() => {
    if (isLoggedIn) {
      navigation.navigate("HomeTab"); // Điều hướng đến "HomeTab" thay vì "Home"
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
        <Stack.Screen name="Main" component={Main}/>
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

