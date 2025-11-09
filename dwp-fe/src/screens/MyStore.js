import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT } from "../utils/constant";

export default function MyStore({ navigation }) {
  const userName = useSelector((state) => state.auth.user?.name);
  const ownerId = useSelector((state) => state.auth.user?.id);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const [newService, setNewService] = useState({
    service_name: "",
    service_price: "",
    slot_service: "",
  });
  const [service, setService] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (ownerId) {
      getService();
    }
  }, [ownerId]);

  const getService = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/store/${ownerId}`);
      setService(res.data.services || []);
      setStoreId(res.data.storeId);
    } catch (error) {
      console.log("Error fetching services:", error);
    }
  };

  const addService = async () => {
    if (
      !newService.service_name ||
      !newService.service_price ||
      !newService.slot_service
    ) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_ROOT}/store/create-service/${storeId}`,
        {
          services: [
            {
              service_name: newService.service_name,
              service_price: Number(newService.service_price),
              slot_service: Number(newService.slot_service),
            },
          ],
        }
      );
      setService((prevService) => [...prevService, newService]);
      Alert.alert("Thêm dịch vụ thành công");
      closeModals();
    } catch (error) {
      console.log(
        "Lỗi khi thêm dịch vụ:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;
    try {
      await axios.put(
        `${API_ROOT}/store/edit-service/${storeId}`,
        {
          _id: selectedService._id,
          service_name: newService.service_name,
          service_price: Number(newService.service_price),
          slot_service: Number(newService.slot_service),
        }
      );
      setService((prevService) =>
        prevService.map((s) =>
          s._id === selectedService._id ? { ...s, ...newService } : s
        )
      );
      Alert.alert("Cập nhật dịch vụ thành công");
      closeModals();
    } catch (error) {
      console.log(
        "Lỗi khi cập nhật dịch vụ:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const openCreateModal = () => {
    setIsCreateModalVisible(true);
    setNewService({ service_name: "", service_price: "", slot_service: "" });
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setNewService({
      service_name: service.service_name,
      service_price: Number(service.service_price),
      slot_service: Number(service.slot_service),
    });
    setIsEditModalVisible(true);
  };

  const openDeleteModal = (service) => {
    setSelectedService(service);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteService = async (id) => {
    try {
      Alert.alert("Xóa dịch vụ thành công");
      setIsDeleteModalVisible(false);
    } catch (error) {
      console.log(
        "Lỗi khi cập nhật dịch vụ:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const closeModals = () => {
    setIsCreateModalVisible(false);
    setIsEditModalVisible(false);
    setIsDeleteModalVisible(false);
  };

  const handleInputChange = (field, value) => {
    setNewService({ ...newService, [field]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dịch vụ của bạn</Text>
      <FlatList
        data={service}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceCard}
            onLongPress={() => openEditModal(item)}
          >
            <Image
              source={require("../../assets/massage.png")}
              style={styles.serviceImage}
            />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.service_name}</Text>
              <Text style={styles.servicePrice}>{item.service_price} VND</Text>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => openDeleteModal(item._id)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => item._id || index.toString()}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isCreateModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Thêm Dịch Vụ Mới</Text>
            <Image
              source={require("../../assets/massage.png")}
              style={styles.serviceImageInsight}
            />

            {/* Tên dịch vụ */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📌 Tên Dịch Vụ:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên dịch vụ..."
                placeholderTextColor="#888"
                value={newService.service_name}
                onChangeText={(text) => handleInputChange("service_name", text)}
              />
            </View>

            {/* Giá dịch vụ */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>💰 Giá Dịch Vụ (VND):</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập giá..."
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newService.service_price}
                onChangeText={(text) =>
                  handleInputChange("service_price", text)
                }
              />
            </View>

            {/* Số lượng dịch vụ */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👥 Số Lượng Người:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số lượng..."
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newService.slot_service}
                onChangeText={(text) => handleInputChange("slot_service", text)}
              />
            </View>

            {/* Nút Hành Động */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModals}
              >
                <Text style={styles.buttonText}>❌ Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton2]}
                onPress={addService}
              >
                <Text style={styles.buttonText}>✔️ Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Chỉnh sửa Dịch Vụ</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📌 Tên Dịch Vụ:</Text>
              <TextInput
                style={styles.input}
                placeholder="Tên dịch vụ"
                value={newService.service_name}
                onChangeText={(text) => handleInputChange("service_name", text)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>💰 Giá Dịch Vụ (VND):</Text>
              <TextInput
                style={styles.input}
                placeholder="Giá dịch vụ"
                keyboardType="numeric"
                value={newService.service_price.toString()}
                onChangeText={(text) =>
                  handleInputChange("service_price", text)
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👥 Số Lượng Người:</Text>
              <TextInput
                style={styles.input}
                placeholder="Số lượng người"
                keyboardType="numeric"
                value={newService.slot_service}
                onChangeText={(text) => handleInputChange("slot_service", text)}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModals}
              >
                <Text style={styles.buttonText}>❌ Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateService}
              >
                <Text style={styles.buttonText}>✔️ Cập Nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑 Xóa Dịch Vụ</Text>
            <Text>Bạn có chắc chắn muốn xóa dịch vụ này không?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModals}
              >
                <Text style={styles.buttonText}>❌ Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteService}
              >
                <Text style={styles.buttonText}>🗑 Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    marginTop: 20,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left",
    marginBottom: 10,
    marginTop: 30,
  },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  serviceImageInsight: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  servicePrice: {
    fontSize: 14,
    color: "#777",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#e91e63",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  menuButton: {
    position: "absolute",
    right: 10, // Căn phải
    bottom: 3, // Căn dưới cùng
    padding: 5, // Khoảng cách nhỏ cho đẹp
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Làm mờ nền phía sau modal
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    width: "85%",
    alignItems: "center",
    elevation: 5, // Hiệu ứng đổ bóng
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#FF5252",
  },
  addButton2: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
});
