import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import axios from "axios";
import { useSelector } from "react-redux";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const CreateOrder = ({ route, navigation }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [orderTime, setOrderTime] = useState("");
  const [slotService, setSlotService] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [service, setService] = useState({});
  const [servicePrice, setServicePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(true);

  const userId = useSelector((state) => state.auth.user?.id);

  const { serviceId } = route.params;

  // Fetch service details
  const getService = async () => {
    try {
      setServiceLoading(true);
      const res = await axios.get(
        `${API_ROOT}/store/get-service/${serviceId}`
      );
      setService({
        serviceName: res.data.serviceName,
        servicePrice: res.data.servicePrice,
        storeName: res.data.storeNameName,
        storeAddress: res.data.storeAddress,
        storeId: res.data.storeId,
        serviceImage: res.data.serviceImage?.[0],
      });
      setServicePrice(res.data.servicePrice);
    } catch (error) {
      console.log("Error fetching service:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin dịch vụ. Vui lòng thử lại.");
    } finally {
      setServiceLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) {
      getService();
    }
  }, [serviceId]);

  // Handle date selection from Calendar
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  // Handle time selection from DateTimePicker
  const onTimeChange = (event, selectedDateTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "set" && selectedDateTime) {
      const hours = selectedDateTime.getHours().toString().padStart(2, "0");
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, "0");
      setOrderTime(`${hours}:${minutes}`);
    }

    if (Platform.OS === "ios") {
      // On iOS, keep picker open until user confirms
      if (event.type === "dismissed") {
        setShowTimePicker(false);
      }
    }
  };

  // Combine date and time into a single order_time
  const getOrderTime = () => {
    if (!selectedDate || !orderTime) {
      return null;
    }

    const date = new Date(selectedDate);
    const [hours, minutes] = orderTime.split(":");
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10)); // Set hours and minutes

    return date.toISOString(); // Chuyển đổi thành ISO string để gửi yêu cầu
  };

  // Handle creating order
  const createOrder = async () => {
    if (!selectedDate) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày đặt lịch");
      return;
    }

    if (!orderTime) {
      Alert.alert("Thông báo", "Vui lòng chọn thời gian");
      return;
    }

    if (!slotService || slotService <= 0) {
      Alert.alert("Thông báo", "Vui lòng nhập số người (lớn hơn 0)");
      return;
    }

    const order_time = getOrderTime();
    if (!order_time) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    const orderData = {
      orderDate: selectedDate,
      customerId: userId,
      service_price: servicePrice,
      slot_service: slotService,
      order_time: order_time,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_ROOT}/service-orders/create-order-id/${serviceId}`,
        orderData
      );
      console.log("Order created successfully:", response.data);
      Alert.alert("Thành công", "Đặt lịch thành công!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("HomeScreen"),
        },
      ]);
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString("vi-VN");
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (serviceLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin dịch vụ...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Đặt lịch dịch vụ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Info Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceImageContainer}>
            <Image
              source={
                service.serviceImage
                  ? { uri: service.serviceImage }
                  : require("../../assets/massage.png")
              }
              style={styles.serviceImage}
            />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={2}>
              {service.serviceName || "Dịch vụ"}
            </Text>
            <View style={styles.storeInfo}>
              <Ionicons name="storefront-outline" size={16} color={COLORS.GRAY} />
              <Text style={styles.storeName} numberOfLines={1}>
                {service.storeName || "Cửa hàng"}
              </Text>
            </View>
            <View style={styles.storeInfo}>
              <Ionicons name="location-outline" size={16} color={COLORS.GRAY} />
              <Text style={styles.storeAddress} numberOfLines={2}>
                {service.storeAddress || "Địa chỉ"}
              </Text>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Giá dịch vụ:</Text>
              <Text style={styles.price}>
                {formatPrice(servicePrice)} VND
              </Text>
            </View>
          </View>
        </View>

        {/* Slot Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Số người</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập số người"
              placeholderTextColor={COLORS.GRAY}
              value={slotService ? slotService.toString() : ""}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                setSlotService(num > 0 ? num : "");
              }}
              keyboardType="numeric"
            />
            <Ionicons name="people" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Chọn ngày</Text>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: COLORS.PRIMARY,
                  selectedTextColor: COLORS.WHITE,
                },
              }}
              onDayPress={onDayPress}
              monthFormat={"yyyy MM"}
              markingType={"simple"}
              minDate={getMinDate()}
              theme={{
                backgroundColor: COLORS.WHITE,
                calendarBackground: COLORS.WHITE,
                textSectionTitleColor: COLORS.TEXT,
                selectedDayBackgroundColor: COLORS.PRIMARY,
                selectedDayTextColor: COLORS.WHITE,
                todayTextColor: COLORS.PRIMARY,
                dayTextColor: COLORS.TEXT,
                textDisabledColor: COLORS.GRAY,
                dotColor: COLORS.PRIMARY,
                selectedDotColor: COLORS.WHITE,
                arrowColor: COLORS.PRIMARY,
                monthTextColor: COLORS.TEXT,
                textDayFontWeight: "500",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "600",
                textDayFontSize: FONTS.REGULAR,
                textMonthFontSize: FONTS.MEDIUM,
                textDayHeaderFontSize: FONTS.SMALL,
              }}
            />
          </View>
        </View>

        {/* Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>Chọn thời gian</Text>
          </View>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <TextInput
              style={styles.input}
              placeholder="Chọn thời gian (HH:mm)"
              placeholderTextColor={COLORS.GRAY}
              value={orderTime}
              editable={false}
              pointerEvents="none"
            />
            <Ionicons name="time" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
          </TouchableOpacity>
          {selectedDate && (
            <Text style={styles.hintText}>
              Đã chọn ngày: {new Date(selectedDate).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>

        {/* DateTimePicker for Time */}
        {showTimePicker && (
          <DateTimePicker
            value={orderTime ? new Date(`2000-01-01T${orderTime}`) : new Date()}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onTimeChange}
          />
        )}

        {/* Button Section */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={createOrder}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons name="calendar" size={24} color={COLORS.WHITE} />
              <Text style={styles.buttonText}>Đặt lịch ngay</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
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
  serviceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceImageContainer: {
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
  },
  serviceImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.BACKGROUND,
  },
  serviceInfo: {
    alignItems: "center",
  },
  serviceName: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: "center",
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.TINY,
    gap: 4,
    width: "100%",
    justifyContent: "center",
  },
  storeName: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  storeAddress: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    flex: 1,
    textAlign: "center",
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.MEDIUM,
    paddingTop: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: SPACING.SMALL,
  },
  priceLabel: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  price: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  section: {
    marginBottom: SPACING.LARGE,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
    gap: SPACING.SMALL,
  },
  sectionTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: SPACING.MEDIUM,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  inputIcon: {
    marginLeft: SPACING.SMALL,
  },
  calendarContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.SMALL,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hintText: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginTop: SPACING.SMALL,
    fontStyle: "italic",
  },
  button: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: SPACING.LARGE,
  },
});

export default CreateOrder;
