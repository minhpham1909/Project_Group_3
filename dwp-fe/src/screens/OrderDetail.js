import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import axios from "axios";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const { width } = Dimensions.get("window");

const OrderDetail = ({ route, navigation }) => {
  const { orderId } = route.params; // Lấy orderId từ params
  const [order, setOrder] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const geocodeAddress = async (address) => {
    if (!address) return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent":
              "MyReactNativeApp/1.0 (contact: your-real-email@domain.com)",
          },
        }
      );
      console.log("Geocoding response:", response.data);

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        if (!isNaN(lat) && !isNaN(lon)) {
          setCoordinates({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          });
        } else {
          console.warn("Invalid lat/lon from geocoding");
        }
      } else {
        console.warn("No geocoding results for address:", address);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
console.log("Order ID:", orderId);

        setLoading(true);
        const response = await axios.get(
          `${API_ROOT}/service-orders/getDetail/${orderId}`
        );

        console.log("Order data:", response.data);

        if (response.status === 200) {
          setOrder(response.data);
          if (response.data.storeId?.address) {
            geocodeAddress(response.data.storeId.address);
          }
        } else {
          setError("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("An error occurred while fetching the order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleOpenMaps = () => {
    if (order?.storeId?.address) {
      const url =
        Platform.OS === "ios"
          ? `maps:0,0?q=${encodeURIComponent(order.storeId.address)}`
          : `geo:0,0?q=${encodeURIComponent(order.storeId.address)}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Lỗi", "Không thể mở bản đồ")
      );
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString("vi-VN");
  };

  // Tạo HTML cho Leaflet map
  const getMapHtml = (lat, lon) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
              html, body, #map { height: 100%; margin: 0; padding: 0; }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              var map = L.map('map').setView([${lat}, ${lon}], 15);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              var marker = L.marker([${lat}, ${lon}]).addTo(map);
              marker.bindPopup('Địa chỉ cửa hàng').openPopup();
          </script>
      </body>
      </html>
    `;
  };

  const statusColors = {
    Pending: "#FF9800",
    Confirm: COLORS.PRIMARY,
    Completed: "#4CAF50",
    Cancelled: COLORS.ERROR,
  };

  const getStatusColor = (status) => statusColors[status] || COLORS.GRAY;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.ERROR}
          />
          <Text style={styles.errorText}>
            {error || "Không tìm thấy đơn hàng"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              setCoordinates(null);
              const fetchOrder = async () => {
                try {
                  const response = await axios.get(
                    `${API_ROOT}/service-orders/getDetail/${orderId}`
                  );
                  if (response.status === 200) {
                    setOrder(response.data);
                    if (response.data.storeId?.address) {
                      geocodeAddress(response.data.storeId.address);
                    }
                  } else {
                    setError("Không tìm thấy đơn hàng.");
                  }
                } catch (err) {
                  console.error("Error fetching order:", err);
                  setError("Đã xảy ra lỗi khi tải thông tin đơn hàng.");
                } finally {
                  setLoading(false);
                }
              };
              fetchOrder();
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContainer}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={20} color={COLORS.GRAY} />
              <Text style={styles.dateText}>
                {new Date(order.orderDate).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            <Text style={styles.totalPrice}>
              Tổng cộng: {formatPrice(order.price)} VND
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tên</Text>
                <Text style={styles.infoValue}>
                  {order.customerId?.profile?.name || "Chưa cập nhật"}
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {order.customerId?.account?.email || "Chưa cập nhật"}
                </Text>
              </View>
            </View>
          </View>

          {/* Store Info */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="storefront" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tên cửa hàng</Text>
                <Text style={styles.infoValue}>
                  {order.storeId?.nameShop || "Chưa cập nhật"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              </View>
              <TouchableOpacity
                style={styles.infoContent}
                onPress={handleOpenMaps}
                activeOpacity={0.7}
              >
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={[styles.infoValue, styles.infoValueTouchable]}>
                  {order.storeId?.address || "Chưa cập nhật"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Map Section */}
            {order.storeId?.address && coordinates && (
              <View style={styles.mapContainer}>
                <TouchableOpacity
                  style={styles.mapWrapper}
                  onPress={handleOpenMaps}
                  activeOpacity={0.8}
                >
                  <WebView
                    source={{
                      html: getMapHtml(
                        coordinates.latitude,
                        coordinates.longitude
                      ),
                    }}
                    style={styles.map}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.mapLoading}>
                        <ActivityIndicator
                          size="small"
                          color={COLORS.PRIMARY}
                        />
                      </View>
                    )}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={handleOpenMaps}
                >
                  <Ionicons name="map-outline" size={16} color={COLORS.WHITE} />
                  <Text style={styles.mapButtonText}>Mở bản đồ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Services List */}
          <View style={styles.servicesCard}>
            <Text style={styles.sectionTitle}>Danh sách dịch vụ</Text>
            {order.services && order.services.length > 0 ? (
              order.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceName}>{service.service_name}</Text>
                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>
                      {formatPrice(service.service_price)} VND
                    </Text>
                    <Text style={styles.serviceDuration}>
                      {service.slot_service} phút
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>Không có dịch vụ nào</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.MEDIUM,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
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
  detailsContainer: {
    padding: SPACING.MEDIUM,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
    gap: SPACING.SMALL,
  },
  dateText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: SPACING.TINY,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 20,
    marginBottom: SPACING.SMALL,
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: FONTS.SMALL,
    fontWeight: "bold",
  },
  totalPrice: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.MEDIUM,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lastInfoRow: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.MEDIUM,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
  },
  infoValue: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
    lineHeight: 22,
  },
  infoValueTouchable: {
    color: COLORS.PRIMARY,
  },
  mapContainer: {
    marginTop: SPACING.MEDIUM,
  },
  mapWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    height: 200,
  },
  mapLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 8,
    marginTop: SPACING.SMALL,
    gap: SPACING.TINY,
  },
  mapButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "500",
  },
  servicesCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceItem: {
    paddingVertical: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: SPACING.SMALL,
  },
  serviceName: {
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  serviceDuration: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
  },
  noServicesText: {
    textAlign: "center",
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    marginTop: SPACING.MEDIUM,
  },
});

export default OrderDetail;
