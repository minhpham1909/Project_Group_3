import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import SLAYME from "../../assets/SLAYME.svg";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const HomeScreen = ({ navigation }) => {
  // Redux state
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const userId = user?.id;
  const token = user?.token;

  // Local state
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [filterPrice, setFilterPrice] = useState("lowToHigh");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterSearch, setFilterSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch all stores
  const getAllStore = async () => {
    try {
      const response = await axios.get(`${API_ROOT}/store/stores`);
      setStores(response.data || []);
      setFilteredStores(response.data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  // Fetch notifications / orders based on role
  const fetchNotifications = async () => {
    if (!user || !role) return;

    try {
      let response;

      if (role === 1) {
        // Customer
        response = await axios.get(
          `${API_ROOT}/service-orders/getNotification/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (role === 2) {
        // Supplier / Store owner
        response = await axios.get(`${API_ROOT}/service-orders`, {
          params: { userId, role },
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Check response
      if (response?.data?.orders && Array.isArray(response.data.orders)) {
        const orders = response.data.orders;
        const pending = orders.filter((o) => o.status === "Pending").length;
        setPendingCount(pending);
      } else {
        setPendingCount(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    getAllStore();
  }, []);

  // Fetch notifications when user is ready
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Filter and sort stores
  useEffect(() => {
    let filtered = [...stores];

    // Search filter
    if (filterSearch.trim()) {
      filtered = filtered
        .map((store) => {
          const matchingServices =
            store.services?.filter((s) =>
              s.service_name.toLowerCase().includes(filterSearch.toLowerCase())
            ) || [];
          return matchingServices.length > 0
            ? { ...store, services: matchingServices }
            : null;
        })
        .filter(Boolean);
    }

    // Location filter
    if (filterLocation !== "All") {
      filtered = filtered.filter((store) =>
        store.address?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Price sort
    filtered.forEach((store) => {
      store.services?.sort((a, b) =>
        filterPrice === "lowToHigh"
          ? a.service_price - b.service_price
          : b.service_price - a.service_price
      );
    });

    setFilteredStores(filtered);
  }, [filterSearch, filterPrice, filterLocation, stores]);

  // Navigate to service detail
  const openServiceDetail = (serviceId) => {
    navigation.navigate("ProductDetail", { serviceId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <SLAYME width={160} height={70} style={{ marginTop: -32 }} />
          </View>

          {/* Search and Icons */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.GRAY}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm dịch vụ..."
                placeholderTextColor={COLORS.GRAY}
                value={filterSearch}
                onChangeText={setFilterSearch}
              />
              {filterSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setFilterSearch("")}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.iconContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("RequestOrder")}
              >
                <Ionicons name="add-circle" size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate(
                    role === 1 ? "Notification" : "SupplierNotification"
                  )
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={COLORS.TEXT}
                />
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price Filters */}
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Sắp xếp theo giá:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterPrice === "lowToHigh" && styles.selectedFilter,
              ]}
              onPress={() => setFilterPrice("lowToHigh")}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={filterPrice === "lowToHigh" ? COLORS.WHITE : COLORS.GRAY}
              />
              <Text
                style={[
                  styles.filterText,
                  filterPrice === "lowToHigh" && styles.selectedFilterText,
                ]}
              >
                Tăng dần
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterPrice === "highToLow" && styles.selectedFilter,
              ]}
              onPress={() => setFilterPrice("highToLow")}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={filterPrice === "highToLow" ? COLORS.WHITE : COLORS.GRAY}
              />
              <Text
                style={[
                  styles.filterText,
                  filterPrice === "highToLow" && styles.selectedFilterText,
                ]}
              >
                Giảm dần
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ nổi bật</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredStores.reduce(
                (count, store) => count + (store.services?.length || 0),
                0
              )}{" "}
              dịch vụ
            </Text>
          </View>

          {filteredStores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={COLORS.GRAY} />
              <Text style={styles.emptyText}>Không tìm thấy dịch vụ nào</Text>
              <Text style={styles.emptySubtext}>
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          ) : (
            <View style={styles.productRow}>
              {filteredStores.map((store) =>
                store.services?.map((service) => (
                  <TouchableOpacity
                    style={styles.productContainer}
                    key={service._id}
                    onPress={() => openServiceDetail(service._id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{
                          uri:
                            store.image?.[0] ||
                            "https://via.placeholder.com/200",
                        }}
                        style={styles.productImage}
                      />
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>
                          {service.service_price?.toLocaleString("vi-VN")} VND
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {service.service_name}
                      </Text>
                      <View style={styles.storeInfo}>
                        <Ionicons
                          name="storefront-outline"
                          size={14}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.storeName} numberOfLines={1}>
                          {store.nameShop}
                        </Text>
                      </View>
                      <View style={styles.locationInfo}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {store.address}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* ... Các section blog, tips giữ nguyên ... */}
      </ScrollView>
    </SafeAreaView>
  );
};

// Blogs và styles giữ nguyên, chỉ sửa badgeText
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollView: { padding: SPACING.MEDIUM, paddingBottom: SPACING.XLARGE },
  header: { marginBottom: SPACING.LARGE },
  logoContainer: { alignItems: "center" },
  searchSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.SMALL,
    marginTop: "40px",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: SPACING.MEDIUM,
    height: 48,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: SPACING.SMALL },
  searchInput: {
    flex: 1,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  clearButton: { padding: SPACING.TINY },
  iconContainer: { flexDirection: "row", gap: SPACING.SMALL },
  iconButton: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.WHITE, fontSize: 10, fontWeight: "bold" },
  filters: { marginBottom: SPACING.LARGE },
  filterLabel: {
    fontSize: FONTS.REGULAR,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  filterButtons: { flexDirection: "row", gap: SPACING.SMALL },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: SPACING.TINY,
  },
  selectedFilter: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterText: { fontSize: FONTS.SMALL, color: COLORS.GRAY, fontWeight: "500" },
  selectedFilterText: { color: COLORS.WHITE, fontWeight: "bold" },
  categorySection: { marginTop: SPACING.MEDIUM, marginBottom: SPACING.LARGE },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
  },
  sectionTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  sectionSubtitle: { fontSize: FONTS.SMALL, color: COLORS.GRAY },
  productRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.SMALL,
  },
  productContainer: {
    width: "48%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: { position: "relative", width: "100%", height: 140 },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  priceBadge: {
    position: "absolute",
    top: SPACING.SMALL,
    right: SPACING.SMALL,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: COLORS.WHITE,
    fontSize: FONTS.TINY,
    fontWeight: "bold",
  },
  productDetails: { padding: SPACING.SMALL },
  productTitle: {
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
    minHeight: 40,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.TINY,
    gap: 4,
  },
  storeName: { fontSize: FONTS.SMALL, color: COLORS.TEXT, flex: 1 },
  locationInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: FONTS.SMALL, color: COLORS.GRAY, flex: 1 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.XLARGE * 2,
  },
  emptyText: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginTop: SPACING.MEDIUM,
  },
  emptySubtext: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginTop: SPACING.TINY,
  },
});

export default HomeScreen;
