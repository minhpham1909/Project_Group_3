import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS } from "../utils/constant";

const CreateStore = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);

  // Basic store info
  const [nameShop, setNameShop] = useState("");
  const [address, setAddress] = useState("");

  // Images
  const [newImages, setNewImages] = useState([]); // { uri, type }

  // Services
  const [services, setServices] = useState([]);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceSlot, setNewServiceSlot] = useState("1");

  // Loading
  const [updating, setUpdating] = useState(false);

  // Open app settings
  const openAppSettings = () => {
    const url = Platform.OS === "ios" ? "app-settings:" : "settings:";
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở cài đặt ứng dụng.");
    });
  };

  // Pick image
  const pickImage = async () => {
    if (newImages.length >= 5) {
      Alert.alert("Giới hạn", "Chỉ được thêm tối đa 5 ảnh.");
      return;
    }
    try {
      const { status, accessPrivileges } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status === "granted") {
        if (accessPrivileges !== "all") {
          Alert.alert(
            "Quyền hạn chế",
            "Vui lòng cấp full access trong Settings để chọn ảnh đầy đủ.",
            [{ text: "OK", onPress: openAppSettings }]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
          const pickerUri = result.assets[0].uri;
          setNewImages([
            ...newImages,
            { uri: pickerUri, type: result.assets[0].type || "image/jpeg" },
          ]);
          Alert.alert("Thành công", "Đã chọn ảnh!");
        }
      } else {
        Alert.alert(
          "Quyền truy cập cần thiết",
          "Ứng dụng cần quyền truy cập thư viện ảnh."
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", `Không thể mở thư viện ảnh: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    Alert.alert("Xóa ảnh", "Bạn có chắc chắn muốn xóa ảnh này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: () => {
          const updatedImages = newImages.filter((_, i) => i !== index);
          setNewImages(updatedImages);
        },
      },
    ]);
  };

  // ✅ Helper: Validate service name (trim, min 3, max 100)
  const validateServiceName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      return "Tên dịch vụ phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Tên dịch vụ không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate service price (number >= 0)
  const validateServicePrice = (priceStr) => {
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      return "Giá dịch vụ phải là số >= 0.";
    }
    return null;
  };

  // Add service
  const addNewService = () => {
    // ✅ Validate service name
    const nameError = validateServiceName(newServiceName);
    if (nameError) {
      Alert.alert("Lỗi", nameError);
      return;
    }

    // ✅ Validate service price
    const priceError = validateServicePrice(newServicePrice);
    if (priceError) {
      Alert.alert("Lỗi", priceError);
      return;
    }

    const newService = {
      service_name: newServiceName.trim(),
      service_price: parseFloat(newServicePrice),
      slot_service: parseFloat(newServiceSlot),
    };

    setServices([...services, newService]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceSlot("");
    setShowNewServiceForm(false);
    Alert.alert("Thành công", "Đã thêm dịch vụ mới!");
  };

  const deleteService = (index) => {
    Alert.alert("Xóa dịch vụ", "Bạn có chắc chắn muốn xóa dịch vụ này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: () => {
          const newServices = services.filter((_, i) => i !== index);
          setServices(newServices);
        },
      },
    ]);
  };

  const updateService = (index, field, value) => {
    const newServices = [...services];
    if (field === "name") {
      // ✅ Validate on update
      const nameError = validateServiceName(value);
      if (nameError) {
        Alert.alert("Lỗi", nameError);
        return;
      }
      newServices[index].service_name = value.trim();
    }
    if (field === "price") {
      const priceError = validateServicePrice(value);
      if (priceError) {
        Alert.alert("Lỗi", priceError);
        return;
      }
      newServices[index].service_price = parseFloat(value) || 0;
    }
    if (field === "slot")
      newServices[index].slot_service = parseFloat(value) || 0;
    setServices(newServices);
  };

  // ✅ Helper: Validate store name (trim, min 3, max 100)
  const validateStoreName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      return "Tên cửa hàng phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Tên cửa hàng không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate address (trim, min 3, max 100)
  const validateAddress = (addr) => {
    const trimmed = addr.trim();
    if (trimmed.length < 3) {
      return "Địa chỉ phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Địa chỉ không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate all services
  const validateAllServices = () => {
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const nameError = validateServiceName(service.service_name);
      if (nameError) return `Dịch vụ ${i + 1}: ${nameError}`;
      const priceError = validateServicePrice(
        service.service_price?.toString()
      );
      if (priceError) return `Dịch vụ ${i + 1}: ${priceError}`;
    }
    if (services.length === 0) {
      return "Phải có ít nhất 1 dịch vụ.";
    }
    return null;
  };

  const createStore = async () => {
    // ✅ Validate store name
    const nameError = validateStoreName(nameShop);
    if (nameError) {
      Alert.alert("Lỗi", nameError);
      return;
    }

    // ✅ Validate address
    const addrError = validateAddress(address);
    if (addrError) {
      Alert.alert("Lỗi", addrError);
      return;
    }

    // ✅ Validate images (at least 1)
    if (newImages.length === 0) {
      Alert.alert("Lỗi", "Vui lòng thêm ít nhất 1 ảnh.");
      return;
    }

    // ✅ Validate all services
    const servicesError = validateAllServices();
    if (servicesError) {
      Alert.alert("Lỗi", servicesError);
      return;
    }

    // ✅ Validate user.id
    if (!user?.id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("nameShop", nameShop.trim());
      formData.append("address", address.trim());
      formData.append("ownerId", user.id);
      formData.append("services", JSON.stringify(services));

      newImages.forEach((imgObj, index) => {
        let uri = imgObj.uri;
        if (!uri.startsWith("file://") && Platform.OS === "android") {
          uri = `file://${uri}`;
        }
        const name = uri.split("/").pop() || `image${index}.jpg`;
        formData.append("images", {
          uri,
          type: imgObj.type,
          name,
        });
      });

      const response = await axios.post(`${API_ROOT}/store/stores`, formData, {
        headers: {
          // Axios tự set Content-Type
        },
      });

      if (response.data?.store) {
        Alert.alert("Thành công", "Tạo cửa hàng thành công!");
        navigation.goBack({ refresh: true });
      }
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert(
        "Lỗi",
        `Tạo cửa hàng thất bại: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderServiceCard = (item, index) => (
    <View style={styles.serviceCard} key={`service-${index}`}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Tên dịch vụ</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_name}
            onChangeText={(value) => updateService(index, "name", value)}
            placeholder="Tên dịch vụ"
          />
        </View>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Giá (VND)</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_price?.toString() || ""}
            keyboardType="numeric"
            onChangeText={(value) => updateService(index, "price", value)}
            placeholder="0"
          />
        </View>
        {/*
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Số slot</Text>
           <TextInput
            style={styles.serviceInput}
            value={item.slot_service?.toString() || ""}
            keyboardType="numeric"
            onChangeText={(value) => updateService(index, "slot", value)}
            placeholder="0"
          /> 
        </View>
        */}
      </View>

      <TouchableOpacity
        style={styles.deleteServiceButton}
        onPress={() => deleteService(index)}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderImageItem = (item, index) => (
    <View style={styles.imageWrapper} key={`img-${index}`}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeImageOverlay}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo cửa hàng mới</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên cửa hàng</Text>
            <TextInput
              style={styles.textInput}
              value={nameShop}
              onChangeText={setNameShop}
              placeholder="Nhập tên cửa hàng"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
              multiline
            />
          </View>
        </View>

        {/* Images */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hình ảnh (Tối đa 5)</Text>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
              disabled={newImages.length >= 5}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imageGrid}>{newImages.map(renderImageItem)}</View>
        </View>

        {/* Services */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dịch vụ</Text>
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={() => setShowNewServiceForm(true)}
            >
              <Ionicons name="add" size={20} color="#4A90E2" />
              <Text style={styles.addServiceText}>Thêm dịch vụ mới</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesList}>
            {services.map(renderServiceCard)}
          </View>

          {showNewServiceForm && (
            <View style={styles.newServiceForm}>
              <Text style={styles.formTitle}>Thêm dịch vụ mới</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên dịch vụ</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceName}
                  onChangeText={setNewServiceName}
                  placeholder="Nhập tên dịch vụ"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giá (VND)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServicePrice}
                  onChangeText={setNewServicePrice}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              {/* <View style={styles.inputGroup}>
                <Text style={styles.label}>Số slot</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceSlot}
                  onChangeText={setNewServiceSlot}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View> */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addNewService}
              >
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={createStore}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Tạo cửa hàng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  headerSpacer: { width: 32 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#2C3E50" },
  label: { fontSize: 14, fontWeight: "500", color: "#34495E", marginBottom: 4 },
  inputGroup: { marginBottom: 16 },
  textInput: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  multilineInput: { height: 80, textAlignVertical: "top" },
  addImageButton: { flexDirection: "row", alignItems: "center" },
  addImageText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 12,
    width: 100,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  removeImageOverlay: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  serviceCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: "relative",
  },
  serviceRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceField: { flex: 1, marginRight: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
    marginBottom: 4,
  },
  serviceInput: {
    borderWidth: 1,
    borderColor: "#BDC3C7",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  deleteServiceButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E74C3C",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  servicesList: { marginBottom: 12 },
  addServiceButton: { flexDirection: "row", alignItems: "center" },
  addServiceText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  newServiceForm: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90E2",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  updateButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonDisabled: { backgroundColor: COLORS.PRIMARY },
  updateButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default CreateStore;
