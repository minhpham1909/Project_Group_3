import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS } from "../utils/constant";
import { useFocusEffect } from "@react-navigation/native";

const MyStore = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getAllStores = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_ROOT}/store/stores/user/${user.id}`
      );
      setStores(response.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load ban đầu khi mount
  useEffect(() => {
    getAllStores();
  }, []); // Giữ nguyên

  // Thêm useFocusEffect để refresh khi focus (sau goBack)
  useFocusEffect(
    useCallback(() => {
      getAllStores(); // Gọi refresh khi focus
    }, []) // Dependency rỗng để chỉ chạy khi focus, không phụ thuộc state
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllStores();
    setRefreshing(false);
  };

  const openStoreDetail = (storeId) => {
    navigation.navigate("StoreDetail", { storeId });
  };

  const editStore = (storeId) => {
    navigation.navigate("EditStore", { storeId });
  };

  const deleteStore = (storeId) => {
    Alert.alert("Xóa cửa hàng", "Bạn có chắc chắn muốn xóa cửa hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_ROOT}/store/stores/${storeId}`);
            getAllStores();
          } catch (error) {
            console.error("Lỗi khi xóa cửa hàng:", error);
            Alert.alert("Lỗi", "Không thể xóa cửa hàng. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
          <Text style={styles.loadingText}>Đang tải danh sách cửa hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#e91e63"]}
            tintColor="#e91e63"
          />
        }
      >
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách cửa hàng</Text>
            <Text style={styles.sectionSubtitle}>{stores.length} cửa hàng</Text>
          </View>
          {stores.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color="#e91e63" />
              <Text style={styles.emptyText}>Bạn chưa có cửa hàng nào</Text>
              <Text style={styles.emptySubtext}>Nhấn nút + để thêm</Text>
            </View>
          )}
          <View style={styles.productRow}>
            {stores.map((store) => (
              <TouchableOpacity
                style={styles.productContainer}
                key={store._id}
                onPress={(e) => {
                  e.stopPropagation();
                  editStore(store._id);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteStore(store._id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#e91e63" />
                  </TouchableOpacity>
                </View>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="storefront-outline"
                    size={40}
                    color="#e91e63"
                  />
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productTitle}>{store.nameShop}</Text>
                  <View style={styles.locationInfo}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#e91e63"
                    />
                    <Text style={styles.locationText}>{store.address}</Text>
                  </View>
                  <View style={styles.servicesInfo}>
                    <Ionicons name="cafe-outline" size={12} color="#e91e63" />
                    <Text style={styles.locationText}>
                      Dịch vụ: {store.services?.length || 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.productContainer}
              onPress={() => navigation.navigate("CreateStore")}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add" size={60} color="#e91e63" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    padding: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    color: "#333333",
    fontSize: 16,
  },
  categorySection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  productRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productContainer: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  actionsContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    flexDirection: "row",
    zIndex: 1,
  },
  actionButton: {
    marginLeft: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productDetails: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: "flex-start",
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  servicesInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#333333",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
});

export default MyStore;
