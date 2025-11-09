import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment-timezone";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function SupplierNotification({ navigation }) {
  const ownerId = useSelector((state) => state.auth.user?.id);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!ownerId) {
      setError("Vui lòng đăng nhập để xem thông báo.");
      setLoading(false);
      return;
    }

    const fetchStore = async () => {
      try {
        const response = await axios.get(
          `${API_ROOT}/store/${ownerId}`
        );
        setStoreId(response.data.storeId);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin cửa hàng:", error);
        setError("Không thể tải cửa hàng.");
        setLoading(false);
      }
    };

    fetchStore();
  }, [ownerId]);

  const fetchNotifications = useCallback(async () => {
    if (!storeId) return;
    try {
      setError(null);
      const response = await axios.get(
        `${API_ROOT}/service-orders/getNotificationBySupplier/${storeId}`
      );

      if (response.data && Array.isArray(response.data.orders)) {
        setNotifications(response.data.orders);
      } else {
        setError("Dữ liệu không hợp lệ.");
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông báo:", err);
      setError("Không thể tải thông báo. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchNotifications();
    }
  }, [storeId, fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleAccept = async (orderId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn chấp nhận đơn hàng này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Chấp nhận",
          style: "default",
          onPress: async () => {
            try {
              await axios.put(
                `${API_ROOT}/service-orders/${orderId}/status-order`,
                {
                  status: "Completed",
                }
              );
              Alert.alert("Thành công", "Lịch hẹn đã được chấp nhận!");
              fetchNotifications();
            } catch (error) {
              console.error("Lỗi khi chấp nhận đơn hàng:", error);
              Alert.alert("Lỗi", "Không thể chấp nhận đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const handleReject = async (orderId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn từ chối đơn hàng này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.put(
                `${API_ROOT}/service-orders/${orderId}/status-order`,
                {
                  status: "Rejected",
                }
              );
              Alert.alert("Thành công", "Lịch hẹn đã bị từ chối!");
              fetchNotifications();
            } catch (error) {
              console.error("Lỗi khi từ chối đơn hàng:", error);
              Alert.alert("Lỗi", "Không thể từ chối đơn hàng. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "chờ xử lý":
        return COLORS.WARNING;
      case "completed":
      case "đã hoàn thành":
        return COLORS.SUCCESS;
      case "rejected":
      case "đã từ chối":
        return COLORS.ERROR;
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "chờ xử lý":
        return "time-outline";
      case "completed":
      case "đã hoàn thành":
        return "checkmark-circle-outline";
      case "rejected":
      case "đã từ chối":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString("vi-VN");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="notifications" size={28} color={COLORS.WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Thông báo đơn hàng</Text>
            <Text style={styles.headerSubtitle}>Quản lý đơn hàng</Text>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <View key={notification.orderId || index} style={styles.notificationCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(notification.status) },
                    ]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {notification.services[0]?.serviceName || "Dịch vụ không xác định"}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={getStatusIcon(notification.status)}
                        size={16}
                        color={getStatusColor(notification.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(notification.status) },
                        ]}
                      >
                        {notification.status || "Chưa xác định"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={18} color={COLORS.GRAY} />
                    <Text style={styles.infoText}>
                      {formatPrice(notification.services[0]?.price || 0)} VND
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.GRAY} />
                    <Text style={styles.infoText}>
                      {moment(notification.schedule)
                        .tz("Asia/Ho_Chi_Minh")
                        .format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color={COLORS.GRAY} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {notification.userName || "Không xác định"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.GRAY} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {notification.userMail || "Không xác định"}
                    </Text>
                  </View>
                </View>

                {notification.status !== "Completed" &&
                  notification.status !== "Rejected" && (
                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAccept(notification.orderId)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
                        <Text style={styles.buttonText}>Chấp nhận</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(notification.orderId)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.WHITE} />
                        <Text style={styles.buttonText}>Từ chối</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={COLORS.GRAY} />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyText}>
                Bạn chưa có đơn hàng nào. Kéo xuống để làm mới.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    paddingHorizontal: SPACING.LARGE,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MEDIUM,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: FONTS.SMALL,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: SPACING.MEDIUM,
    paddingBottom: SPACING.XLARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.XLARGE,
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.ERROR,
    marginTop: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: 12,
    gap: SPACING.SMALL,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  notificationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: SPACING.MEDIUM,
  },
  cardContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: SPACING.TINY,
    paddingHorizontal: SPACING.SMALL,
    borderRadius: 12,
    backgroundColor: `${COLORS.PRIMARY}15`,
    gap: 4,
  },
  statusText: {
    fontSize: FONTS.TINY,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: SPACING.MEDIUM,
    gap: SPACING.SMALL,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.SMALL,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.SMALL,
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    gap: SPACING.SMALL,
    paddingTop: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    gap: SPACING.SMALL,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.ERROR,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    gap: SPACING.SMALL,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.XLARGE * 2,
    paddingHorizontal: SPACING.XLARGE,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: "center",
  },
  emptyText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
    lineHeight: 22,
  },
});
