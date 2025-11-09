import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const { width } = Dimensions.get("window");

const ProductDetail = ({ route, navigation }) => {
  const { serviceId } = route.params; // lấy serviceId từ params
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); // Để hiển thị trạng thái loading
  const [error, setError] = useState(null); // Để xử lý lỗi nếu có

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true); // Bắt đầu loading
        const response = await axios.get(
          `${API_ROOT}/store/get-service/${serviceId}`
        );

        if (response.status === 200) {
          setProduct(response.data); // Lưu sản phẩm vào state
        } else {
          setError("Service not found.");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("An error occurred while fetching the product.");
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    fetchProduct();
  }, [serviceId]);

  const handleAddToCart = () => {
    if (product) {
      navigation.navigate("CreateOrder", { serviceId: product.serviceId });
    } else {
      Alert.alert("Lỗi", "Không thể thêm dịch vụ vào giỏ hàng");
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString("vi-VN");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết dịch vụ</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              const fetchProduct = async () => {
                try {
                  const response = await axios.get(
                    `${API_ROOT}/store/get-service/${serviceId}`
                  );
                  if (response.status === 200) {
                    setProduct(response.data);
                  } else {
                    setError("Không tìm thấy dịch vụ.");
                  }
                } catch (err) {
                  console.error("Error fetching product:", err);
                  setError("Đã xảy ra lỗi khi tải thông tin dịch vụ.");
                } finally {
                  setLoading(false);
                }
              };
              fetchProduct();
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !product ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cube-outline" size={64} color={COLORS.GRAY} />
          <Text style={styles.errorText}>Không có thông tin dịch vụ</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Gallery */}
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
            >
              {product.serviceImage && product.serviceImage.length > 0 ? (
                product.serviceImage.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={64} color={COLORS.GRAY} />
                  <Text style={styles.placeholderText}>Không có hình ảnh</Text>
                </View>
              )}
            </ScrollView>
            {product.serviceImage && product.serviceImage.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  1 / {product.serviceImage.length}
                </Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.productTitle}>{product.serviceName}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>
                  {formatPrice(product.servicePrice)} VND
                </Text>
              </View>
            </View>

            {/* Store Information */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="storefront" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Cửa hàng</Text>
                  <Text style={styles.infoValue}>
                    {product.storeNameName || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>
                    {product.storeAddress || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description Section */}
            {product.description && (
              <View style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>Mô tả dịch vụ</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="cart" size={24} color={COLORS.WHITE} />
              <Text style={styles.addToCartButtonText}>Đặt lịch ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  imageContainer: {
    position: "relative",
    marginBottom: SPACING.MEDIUM,
  },
  imageScrollView: {
    width: width,
  },
  productImage: {
    width: width,
    height: 350,
    backgroundColor: COLORS.WHITE,
  },
  placeholderImage: {
    width: width,
    height: 350,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: SPACING.SMALL,
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
  },
  imageIndicator: {
    position: "absolute",
    bottom: SPACING.MEDIUM,
    right: SPACING.MEDIUM,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: SPACING.TINY,
    paddingHorizontal: SPACING.SMALL,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: COLORS.WHITE,
    fontSize: FONTS.TINY,
    fontWeight: "600",
  },
  detailsContainer: {
    padding: SPACING.MEDIUM,
  },
  titleSection: {
    marginBottom: SPACING.LARGE,
  },
  productTitle: {
    fontSize: FONTS.XXLARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    lineHeight: 36,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  productPrice: {
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
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
  descriptionCard: {
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
    marginBottom: SPACING.SMALL,
  },
  descriptionText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    lineHeight: 24,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    borderRadius: 16,
    marginTop: SPACING.MEDIUM,
    gap: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
  },
});

export default ProductDetail;
