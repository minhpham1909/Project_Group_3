import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment-timezone";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function Notification({ navigation }) {
  const userId = useSelector((state) => state.auth.user?.id);
  const role = useSelector((state) => state.auth.user?.role);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setError("Vui lòng đăng nhập để xem thông báo.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axios.get(
        `${API_ROOT}/service-orders/getNotification/${userId}`
      );

      if (response.data && Array.isArray(response.data.orders)) {
        setData(response.data.orders);
        console.log("Notifications data:", response.data);
      } else {
        console.error("Dữ liệu không đúng cấu trúc:", response.data);
        setError("Dữ liệu không hợp lệ.");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Không thể tải thông báo. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "chờ xử lý":
        return COLORS.WARNING;
      case "accepted":
      case "đã chấp nhận":
        return COLORS.SUCCESS;
      case "rejected":
      case "đã từ chối":
        return COLORS.ERROR;
      case "completed":
      case "hoàn thành":
        return COLORS.INFO;
      default:
        return COLORS.GRAY;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "chờ xử lý":
        return "time-outline";
      case "accepted":
      case "đã chấp nhận":
        return "checkmark-circle-outline";
      case "rejected":
      case "đã từ chối":
        return "close-circle-outline";
      case "completed":
      case "hoàn thành":
        return "checkmark-done-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="notifications" size={28} color={COLORS.WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <Text style={styles.headerSubtitle}>Đặt lịch dịch vụ</Text>
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
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.ERROR}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchNotifications}
          >
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
          {data.length > 0 ? (
            data.map((notification, index) => (
              <TouchableOpacity
                key={notification.id || index}
                style={styles.notificationCard}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate("OrderDetail", {
                    orderId: notification.id,
                  });
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor: getStatusColor(notification.status),
                        },
                      ]}
                    />
                    <View style={styles.cardContent}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {notification.services[0]?.serviceName ||
                          "Dịch vụ không xác định"}
                      </Text>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {notification.orderId || "Dịch vụ không xác định"}
                      </Text>
                      <View style={styles.storeInfo}>
                        <Ionicons
                          name="storefront-outline"
                          size={16}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.storeName} numberOfLines={1}>
                          {notification.storeName || "Cửa hàng không xác định"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          notification.status
                        )}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(notification.status)}
                      size={16}
                      color={getStatusColor(notification.status)}
                    />
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.GRAY}
                    />
                    <Text style={styles.infoText}>
                      {moment(notification.schedule)
                        .tz("Asia/Ho_Chi_Minh")
                        .format("DD/MM/YYYY HH:mm")}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={COLORS.GRAY}
                    />
                    <Text style={styles.infoText} numberOfLines={2}>
                      {notification.location || "Chưa có địa điểm"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusContainer,
                      {
                        backgroundColor: `${getStatusColor(
                          notification.status
                        )}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(notification.status)}
                      size={14}
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
                  <View style={styles.viewDetailButton}>
                    <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={COLORS.GRAY}
                />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyText}>
                Bạn chưa có thông báo đặt lịch nào. Kéo xuống để làm mới.
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
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
    marginBottom: SPACING.TINY,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeName: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    flex: 1,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.TINY,
    paddingHorizontal: SPACING.SMALL,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: FONTS.TINY,
    fontWeight: "600",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: FONTS.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: "600",
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
