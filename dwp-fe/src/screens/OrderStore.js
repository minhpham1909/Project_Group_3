import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars"; // Giả sử đã install react-native-calendars
import moment from "moment-timezone";
import { API_ROOT } from "../utils/constant"; // Giữ nguyên nếu cần fetch thực tế
import axios from "axios";
import { useSelector } from "react-redux";

export default function OrderCalendar() {
  const [orders, setOrders] = useState([]); // Dữ liệu orders
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  ); // Ngày mặc định là hôm nay
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({}); // Đánh dấu ngày có order

  // 🔹 Load dữ liệu (mẫu hoặc fetch)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Nếu fetch thực tế:
      const response = await axios.get(`${API_ROOT}/service-orders`, {
        params: { userId: user?.id, role: user?.role },
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setOrders(response.data.orders || []);

      // Sử dụng dữ liệu mẫu
      if (response.success) {
        setOrders(response.orders);
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Group orders theo ngày và đánh dấu calendar
  const processOrdersForCalendar = (ordersData) => {
    const marked = {};
    const grouped = {};

    ordersData.forEach((order) => {
      const orderDay = moment(order.orderDate)
        .tz("Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");
      if (!marked[orderDay]) {
        marked[orderDay] = {
          marked: true,
          dotColor: "#e91e63",
          selected: false,
        };
      }
      if (!grouped[orderDay]) {
        grouped[orderDay] = [];
      }
      grouped[orderDay].push(order);
    });

    // Đánh dấu ngày hiện tại nếu không có order
    const today = moment().format("YYYY-MM-DD");
    if (!marked[today]) {
      marked[today] = { selected: true, selectedColor: "#e91e63" };
    }

    setMarkedDates(marked);
    return grouped;
  };

  useEffect(() => {
    fetchOrders().then(() => {
      // Sau khi load orders, process
      processOrdersForCalendar(orders);
    });
  }, []);

  // 🔹 Xử lý chọn ngày
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  // 🔹 Lọc orders theo ngày được chọn
  const filteredOrders = orders.filter(
    (order) =>
      moment(order.orderDate).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD") ===
      selectedDate
  );

  // 🔹 Render order item
  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.serviceName}>
          🏪 {item.storeId?.name || "Cửa hàng"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.orderDetails}>
        👤 {item.customerId?.profile?.name || "Không rõ"} (
        {item.customerId?.profile?.phone || "N/A"})
      </Text>
      <Text style={styles.orderDetails}>
        📧 {item.customerId?.account?.email || "N/A"}
      </Text>
      <Text style={styles.orderDetails}>
        💰 Tổng: {item.price?.toLocaleString()}₫
      </Text>

      {item.services?.map((service, index) => (
        <View key={index} style={styles.serviceBox}>
          <Text style={styles.serviceText}>
            🔹 {service.service_name} -{" "}
            {service.service_price?.toLocaleString()}₫ (Slot:{" "}
            {service.slot_service})
          </Text>
        </View>
      ))}
    </View>
  );

  // 🔹 Màu theo trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Rejected":
        return "#f44336";
      case "Pending":
        return "#FF9800";
      case "Confirm":
        return "#2196F3";
      default:
        return "#e91e63";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
          <Text style={styles.loadingText}>Đang tải lịch đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quản lý đặt lịch</Text>

      {/* Phần trên: Calendar và ngày chọn */}
      <View style={styles.topSection}>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: "#FFFFFF",
              calendarBackground: "#FFFFFF",
              selectedDayBackgroundColor: "#e91e63",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#e91e63",
              dayTextColor: "#000000",
              textDisabledColor: "#d9e1e8",
              dotColor: "#e91e63",
              selectedDotColor: "#FFFFFF",
              arrowColor: "#e91e63",
              monthTextColor: "#000000",
              indicatorColor: "transparent",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            Ngày {moment(selectedDate).format("DD/MM/YYYY")}
          </Text>
        </View>
      </View>

      {/* Phần dưới: FlatList với flex:1 */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        style={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersText}>Lịch trống </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#000000",
  },
  topSection: {
    flex: 0, // Không co giãn
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  selectedDateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  listContainer: {
    flex: 1, // Chiếm phần còn lại
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  orderDetails: {
    fontSize: 14,
    color: "#333333",
    marginVertical: 4,
    lineHeight: 20,
  },
  serviceBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  emptyOrders: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyOrdersText: {
    color: "#666666",
    fontSize: 16,
    textAlign: "center",
  },
});
