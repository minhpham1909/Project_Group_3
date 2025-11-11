import React, { useState, useEffect } from "react";
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
  Linking, // ← Thêm import này để mở settings nếu cần
  Platform, // ← Thêm import này để check platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS } from "../utils/constant";

const EditStore = ({ route, navigation }) => {
  const { storeId } = route.params;
  const user = useSelector((state) => state.auth.user);
  const [store, setStore] = useState(null);
  const [nameShop, setNameShop] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]); // Track removed URLs for BE
  const [services, setServices] = useState([]); // Array of {service_name, service_price, _id?}
  const [newServiceName, setNewServiceName] = useState(""); // For adding new service
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceSlot, setNewServiceSlot] = useState(""); // For adding new service
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ROOT}/store/store/${storeId}`); // ← FIX: Thay /store/stores/ thành /store/
      const storeData = response.data;
      setStore(storeData);
      setNameShop(storeData.nameShop);
      setAddress(storeData.address);
      setImages(storeData.image || []);
      setServices(storeData.services || []); // Load services
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu cửa hàng:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  const openAppSettings = () => {
    const url = Platform.OS === "ios" ? "app-settings:" : "settings:";
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở cài đặt ứng dụng.");
    });
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission status:", status); // ← Thêm log để debug

    if (status === "granted") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log("Picker result:", result); // ← Thêm log để debug

      if (!result.canceled) {
        setNewImages([...newImages, result.assets[0].uri]);
      }
    } else if (status === "denied") {
      Alert.alert(
        "Quyền bị từ chối",
        "Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong Cài đặt > Quyền riêng tư > Thư viện ảnh.",
        [{ text: "Hủy" }, { text: "Mở Cài đặt", onPress: openAppSettings }]
      );
    } else {
      // undetermined hoặc limited (iOS)
      Alert.alert(
        "Quyền truy cập cần thiết",
        "Cần quyền truy cập thư viện ảnh để chọn ảnh. Vui lòng cấp quyền."
      );
    }
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      const newNewImages = newImages.filter((_, i) => i !== index);
      setNewImages(newNewImages);
    } else {
      Alert.alert("Xóa ảnh", "Ảnh này sẽ được xóa khi cập nhật?", [
        { text: "Hủy" },
        {
          text: "Xóa",
          onPress: () => {
            const removedUrl = images[index];
            setRemovedImages([...removedImages, removedUrl]); // Track for BE
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
          },
        },
      ]);
    }
  };

  // Add new service
  const addNewService = () => {
    if (
      !newServiceName.trim() ||
      !newServicePrice.trim() ||
      !newServiceSlot.trim()
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập tên, giá và số slot dịch vụ.");
      return;
    }
    const newService = {
      service_name: newServiceName,
      service_price: parseFloat(newServicePrice),
      slot_service: parseFloat(newServiceSlot),
    };
    setServices([...services, newService]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceSlot("");
    Alert.alert("Thành công", "Đã thêm dịch vụ mới!");
  };

  // Delete service
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

  // Update service (inline edit via state)
  const updateService = (index, field, value) => {
    const newServices = [...services];
    if (field === "name") {
      newServices[index].service_name = value;
    } else if (field === "price") {
      newServices[index].service_price = parseFloat(value) || 0;
    } else if (field === "slot") {
      newServices[index].slot_service = parseFloat(value) || 0;
    }
    setServices(newServices);
  };

  const updateStore = async () => {
    if (!nameShop || !address) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("nameShop", nameShop);
      formData.append("address", address);
      formData.append("services", JSON.stringify(services)); // Send updated services as JSON

      // Send removed images
      if (removedImages.length > 0) {
        formData.append("removeImages", JSON.stringify(removedImages));
      }

      // Add new images
      newImages.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const file = {
          uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
          type,
          name: filename,
        };
        formData.append("images", file);
      });

      console.log("New images URIs:", newImages); // Check array có URI?
      console.log("Removed images:", removedImages);
      // Log FormData (không full, chỉ keys)
      for (let [key, value] of formData.entries()) {
        console.log(key, value); // 'images' sẽ show file object
      }

      // Do not set Content-Type header; let Axios handle it
      const response = await axios.put(
        `${API_ROOT}/store/stores/${storeId}`, // ← Giữ nguyên PUT route (nếu BE là /stores/:storeId)
        formData,
        {
          headers: {
            // "Content-Type": "multipart/form-data", // Remove this line
          },
        }
      );

      if (response.data) {
        Alert.alert("Thành công", "Cập nhật cửa hàng thành công!");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật cửa hàng:", error);
      Alert.alert("Lỗi", `Không thể cập nhật cửa hàng: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy cửa hàng</Text>
      </SafeAreaView>
    );
  }

  const renderServiceCard = (item, index) => (
    <View style={styles.serviceCard} key={`service-${index}`}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Tên dịch vụ</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_name || ""}
            onChangeText={(value) => updateService(index, "name", value)}
            placeholder="Nhập tên dịch vụ"
          />
        </View>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Giá (VND)</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_price ? item.service_price.toString() : ""}
            onChangeText={(value) => updateService(index, "price", value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Số slot</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.slot_service ? item.slot_service.toString() : ""}
            onChangeText={(value) => updateService(index, "slot", value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteServiceButton}
        onPress={() => deleteService(index)}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const allImages = [...images, ...newImages];
  const renderImageItem = (item, index) => {
    const isNew = index >= images.length;
    const realIndex = isNew ? index - images.length : index;
    return (
      <View style={styles.imageWrapper} key={`img-${index}`}>
        <Image source={{ uri: item }} style={styles.image} />
        <TouchableOpacity
          style={styles.removeImageOverlay}
          onPress={() => removeImage(realIndex, isNew)}
        >
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa cửa hàng</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
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
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hình ảnh</Text>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imageGrid}>{allImages.map(renderImageItem)}</View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dịch vụ</Text>
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={addNewService}
            >
              <Ionicons name="add" size={20} color="#4A90E2" />
              <Text style={styles.addServiceText}>Thêm dịch vụ mới</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesList}>
            {services.map(renderServiceCard)}
          </View>
          {newServiceName || newServicePrice || newServiceSlot ? (
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
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số slot</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceSlot}
                  onChangeText={setNewServiceSlot}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addNewService}
              >
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={updateStore}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Cập nhật cửa hàng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#4A90E2",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34495E",
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
  },
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
    backgroundColor: "#FFFFFF",
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
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceField: {
    flex: 1,
    marginRight: 8,
  },
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
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
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
  servicesList: {
    marginBottom: 12,
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addServiceText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  newServiceForm: {
    backgroundColor: "#E8F4FD",
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
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: "#AED6F1",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7F8C8D",
  },
  errorText: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#E74C3C",
  },
});

export default EditStore;
