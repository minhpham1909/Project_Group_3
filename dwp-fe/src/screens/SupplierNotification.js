import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal,
} from "react-native";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment-timezone";
import { API_ROOT } from "../utils/constant";

export default function SupplierNotification() {
  const user = useSelector((state) => state.auth.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Danh sách trạng thái có thể chọn
  const statusOptions = [
    { label: "Hoàn thành", value: "Completed" },
    { label: "Hủy", value: "Cancelled" }, // Sửa từ "Rejected" thành "Cancelled" để khớp BE
    { label: "Xác nhận", value: "Confirm" },
  ];

  // 🔹 Lấy tất cả đơn hàng
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Gửi userId và role dưới dạng query params nếu backend chưa có middleware
      const response = await axios.get(`${API_ROOT}/service-orders`, {
        params: { userId: user?.id, role: user?.role },
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      if (response.data && response.data.success) {
        setOrders(response.data.orders);
        setError(null);
      } else {
        setOrders([]);
        setError("Không có dữ liệu đơn hàng.");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
      setOrders([]);
      setError("Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id && user?.role) fetchOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // 🔹 Mở modal chọn trạng thái
  const openStatusModal = (orderId) => {
    setCurrentOrderId(orderId);
    setShowStatusModal(true);
  };

  // 🔹 Chọn trạng thái và cập nhật
  const selectStatus = (newStatus) => {
    if (currentOrderId) {
      handleStatusChange(currentOrderId, newStatus);
    }
    setShowStatusModal(false);
    setCurrentOrderId(null);
  };

  // 🔹 Cập nhật trạng thái đơn hàng
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_ROOT}/service-orders/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      Alert.alert("✅ Thành công", `Đơn hàng đã được cập nhật: ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng.");
    }
  };

  // 🔹 Màu theo trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Rejected":
      case "Cancelled":
        return "#f44336";
      case "Pending":
        return "#FF9800";
      case "Confirm":
        return "#2196F3";
      default:
        return "#e91e63";
    }
  };

  // 🔹 Render từng đơn hàng
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
        👤 Khách hàng: {item.customerId?.profile?.name || "Không rõ"}
      </Text>
      <Text style={styles.orderDetails}>
        📧 Email: {item.customerId?.account?.email || "N/A"}
      </Text>
      <Text style={styles.orderDetails}>
        📧 Số điện thoại: {item.customerId?.profile?.phone || "N/A"}
      </Text>
      <Text style={styles.orderDetails}>
        📅 Ngày đặt:{" "}
        {moment(item.orderDate)
          .tz("Asia/Ho_Chi_Minh")
          .format("DD/MM/YYYY HH:mm")}
      </Text>

      {item.services?.map((service, index) => (
        <View key={index} style={styles.serviceBox}>
          <Text style={styles.serviceText}>
            🔹 {service.service_name} -{" "}
            {service.service_price?.toLocaleString()}₫
          </Text>
        </View>
      ))}

      {item.status !== "Completed" && (
        <TouchableOpacity
          style={styles.statusSelectButton}
          onPress={() => openStatusModal(item._id)}
          activeOpacity={0.8}
        >
          <Text style={styles.statusSelectText}>Chọn trạng thái mới</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchOrders();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Thông báo của bạn</Text>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#e91e63"]}
            tintColor="#e91e63"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📭 Không có đơn hàng nào</Text>
            <Text style={styles.emptySubText}>Kéo xuống để làm mới</Text>
          </View>
        }
      />

      {/* Modal chọn trạng thái */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chọn Trạng Thái Mới</Text>
            <FlatList
              data={statusOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item: statusOption }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectStatus(statusOption.value)}
                >
                  <Text style={styles.modalItemText}>{statusOption.label}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Trắng làm background chính
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    color: "#000000", // Đen cho tiêu đề
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: "#FFFFFF", // Trắng cho card
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F5F5F5", // Xám rất nhạt cho border
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
    color: "#000000", // Đen cho tên dịch vụ
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
    color: "#333333", // Xám đậm cho details
    marginVertical: 4,
    lineHeight: 20,
  },
  serviceBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FAFAFA", // Xám rất nhạt cho service box
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 14,
    color: "#000000", // Đen cho service text
    lineHeight: 18,
  },
  statusSelectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  statusSelectText: {
    fontSize: 16,
    color: "#000000",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: "#666666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666", // Xám cho loading text
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#f44336",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#e91e63",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#000000", // Đen cho empty text
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    color: "#666666", // Xám cho subtext
    fontSize: 14,
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#000000",
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#e91e63",
    fontWeight: "500",
  },
});
