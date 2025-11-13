import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
} from "react-native";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_ROOT } from "../utils/constant";

export default function Test({ navigation }) {
  const [quizData, setQuizData] = useState(null); // Dữ liệu quiz nhận từ server
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [title, setTitle] = useState(""); // Sẽ được set mặc định hoặc từ dropdown
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(""); // Giả sử bạn cần chọn category, nếu có
  const [aiFeedback, setAiFeedback] = useState(""); // Lưu nhận xét từ AI
  const [isLoading, setIsLoading] = useState(false); // Thêm state để quản lý loading
  const [showTitleModal, setShowTitleModal] = useState(false); // State cho modal dropdown

  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();

  const quizTitles = [
    "Tóc chắc khỏe",
    "Tóc mọc nhanh",
    "Chăm sóc tóc hư tổn",
    "Ngăn rụng tóc",
    "Tóc bóng mượt",
    "Phục hồi tóc khô",
    "Tóc nhuộm khỏe mạnh",
    "Tóc dày tự nhiên",
    "Giảm gàu và ngứa",
    "Tóc mềm mượt mỗi ngày",
  ];

  // Hàm chọn tiêu đề từ dropdown
  const selectTitle = (selectedTitle) => {
    setTitle(selectedTitle);
    setShowTitleModal(false);
  };

  // Hàm reset để tạo quiz mới
  const resetForNewQuiz = () => {
    setTitle("");
    setDescription("");
    setQuizData(null);
    setIsQuizStarted(false);
    setFinished(false);
    setAiFeedback("");
    setScore(0);
  };

  // Bắt đầu quiz và gọi API để lấy dữ liệu quiz
  const startQuiz = async () => {
    if (!title) {
      Alert.alert("Lỗi", "Vui lòng chọn mục tiêu tư vấn.");
      return;
    }

    if (!description || description.length < 4) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả tối thiểu 4 kí tự");
      return;
    }

    try {
      const res = await axios.post(`${API_ROOT}/quiz/createQuiz`, {
        title: title,
        description: description,
        userId: userId,
        categoryId: "605c72ef0f1b2c001f92a3e0",
      });
      const quizId = res.data.quiz._id; // Assuming the quiz object has an _id property
      setQuizData(null); // Clear any previous quiz data

      // Now fetch the quiz using its ID
      await fetchQuizById(quizId); // Fetch the quiz data by ID
      setIsQuizStarted(true);
      setScore(0);
      setFinished(false);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Hệ thống đang quá tải, vui lòng thử lại tính năng này sau."
      );
      console.log("Error fetching quiz data:", error);
    }
  };

  // Function to fetch quiz by ID
  const fetchQuizById = async (quizId) => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/${quizId}`);
      setQuizData(res.data); // Set the quiz data
    } catch (error) {
      console.log("Error fetching quiz by ID:", error);
    }
  };

  // Xử lý khi người dùng trả lời một câu hỏi
  const handleAnswer = (questionIndex, answer) => {
    const updatedQuiz = { ...quizData };

    // Kiểm tra câu hỏi và gán đáp án cho câu hỏi đó
    updatedQuiz.questions[questionIndex].answers = [answer]; // Lưu chỉ một đáp án duy nhất cho câu hỏi

    // Kiểm tra nếu tất cả các câu hỏi đã được trả lời
    // setFinished(updatedQuiz.questions.every(q => q.answers && q.answers.length > 0));
    setQuizData(updatedQuiz); // Cập nhật trạng thái quiz
  };

  // Hàm nộp quiz
  const submitQuiz = async () => {
    const answers = quizData.questions.map((question) => ({
      questionId: question.questionId._id, // Lấy ID của câu hỏi
      answers: question.answers, // Chỉ gửi câu trả lời của các câu hỏi
    }));

    // Bắt đầu loading
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_ROOT}/quiz/submit/${quizData._id}`,
        { answers }
      );

      if (response.data.message === "Quiz đã được gửi thành công") {
        console.log("Quiz đã gửi thành công", response.data);
        setFinished(true); // Đánh dấu quiz đã hoàn thành
        setAiFeedback(response.data.feedback); // Lưu phản hồi từ AI
        Alert.alert("Thành công", "Đã gửi phân tích thành công.");
      } else {
        Alert.alert(
          "Lỗi",
          "Hệ thống đang quá tải, vui lòng thử lại tính năng này sau."
        );
        console.log("Lỗi: ", response.data.message);
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Hệ thống đang quá tải, vui lòng thử lại tính năng này sau."
      );
      // console.error("Lỗi khi gửi quiz:", error);
    } finally {
      // Tắt loading sau khi đã nhận được phản hồi
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
          <Text style={styles.loadingText}>Đang phân tích, vui lòng đợi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isQuizStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.setupHeader}>
            <Text style={styles.setupTitle}>Bắt Đầu Phân Tích Tóc</Text>
            <Text style={styles.setupSubtitle}>
              Cung cấp thông tin để hệ thống chẩn đoán và đưa ra lời khuyên
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mục Tiêu Của Bạn</Text>
            <TouchableOpacity
              style={styles.dropdownContainer}
              onPress={() => setShowTitleModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !title ? styles.placeholderText : {},
                ]}
              >
                {title || "Chọn mục tiêu cần tư vấn"}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {/* Hiển thị tiêu đề đã chọn */}
            {title && <Text style={styles.selectedTitle}>{title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô Tả Tình Trạng Tóc</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ví dụ: Tóc tôi khô, xơ và dễ gãy rụng sau khi nhuộm..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startQuiz}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Bắt Đầu Phân Tích</Text>
          </TouchableOpacity>

          {/* PHẦN NOTE MỚI ĐƯỢC THÊM */}
          <Text style={styles.noteText}>
            * Hệ thống sẽ tạo một bộ câu hỏi dựa trên thông tin bạn cung cấp để đưa ra lời khuyên chính xác nhất.
          </Text>
        </ScrollView>

        {/* Modal cho dropdown select */}
        <Modal
          visible={showTitleModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTitleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Chọn Mục Tiêu Tư Vấn</Text>
              <FlatList
                data={quizTitles}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => selectTitle(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTitleModal(false)}
              >
                <Text style={styles.modalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            styles.completedScroll,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.completedHeader}>
            <Text style={styles.completedTitle}>Đã Có Kết Quả Phân Tích!</Text>
            <Text style={styles.completedSubtitle}>
              Hãy xem lời khuyên từ CutMate Brain
            </Text>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>
              Chẩn Đoán & Lời Khuyên từ CutMate Brain
            </Text>
            <View style={styles.feedbackCard}>
              <ScrollView
                style={styles.feedbackScroll}
                showsVerticalScrollIndicator={true}
              >
                {Array.isArray(aiFeedback) ? (
                  aiFeedback.map((feedback, index) => (
                    <Text key={index} style={styles.feedbackText}>
                      {feedback}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.feedbackText}>
                    {aiFeedback ?? "Không có nhận xét từ AI"}
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.retakeButton]}
            onPress={startQuiz}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Phân Tích Lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, styles.newButton]}
            onPress={resetForNewQuiz}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Tạo Phân Tích Mới</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.quizHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.quizTitle}>Mục tiêu: {title}</Text>
          <Text style={styles.quizDescription}>Tình trạng: {description}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <FlatList
        data={quizData.questions}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.questionsList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Câu {index + 1}</Text>
            </View>
            <Text style={styles.questionText}>{item.questionId.content}</Text>

            {item.questionId.options.length > 0 ? (
              <View style={styles.optionsContainer}>
                <FlatList
                  data={item.questionId.options}
                  keyExtractor={(option, optionIndex) => optionIndex.toString()}
                  numColumns={2}
                  renderItem={({ item: option }) => (
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        item.answers &&
                          item.answers.includes(option) &&
                          styles.selectedOption,
                      ]}
                      onPress={() => handleAnswer(index, option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          item.answers &&
                            item.answers.includes(option) &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <Text style={styles.noOptionsText}>Không có lựa chọn nào</Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitQuiz}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>Xem Kết Quả Phân Tích</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Trắng làm background chính
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  completedScroll: {
    paddingBottom: 20, // Giảm padding bottom để feedback gần nút hơn
  },

  // Setup Screen Styles
  setupHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000", // Đen cho tiêu đề
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: "#666666", // Xám đậm cho subtitle
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000", // Đen cho label
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000000",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 16,
    color: "#666666",
  },
  selectedTitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#e91e63",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0", // Xám nhạt cho border
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA", // Xám rất nhạt cho input background
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  // NOTE TEXT STYLE (MỚI THÊM)
  noteText: {
    marginTop: 12,
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 16,
    fontStyle: "italic",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#000000",
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#e91e63",
    fontWeight: "500",
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666", // Xám cho text loading
  },

  // Quiz Screen Styles
  quizHeader: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  headerContent: {
    marginBottom: 16,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000", // Đen cho title
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: "#666666", // Xám cho description
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E0E0E0", // Xám nhạt cho progress background
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    flex: 1,
    backgroundColor: "#e91e63", // Hồng accent cho progress
    borderRadius: 2,
  },

  questionsList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Để tránh bị che bởi button
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#F5F5F5", // Xám rất nhạt cho border card
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    backgroundColor: "#e91e63",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000", // Đen cho câu hỏi
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#FAFAFA", // Xám rất nhạt cho option
    borderWidth: 2,
    borderColor: "#E0E0E0", // Xám nhạt cho border
    borderRadius: 12,
    padding: 16,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
  },
  selectedOption: {
    backgroundColor: "#e91e63",
    borderColor: "#e91e63",
  },
  optionText: {
    fontSize: 14,
    color: "#000000", // Đen cho option text
    textAlign: "center",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noOptionsText: {
    fontSize: 14,
    color: "#999999", // Xám cho no options
    textAlign: "center",
    marginTop: 16,
  },

  // Submit Button
  submitButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#e91e63",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Completed Screen Styles
  completedHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000", // Đen cho completed title
    marginBottom: 4,
  },
  completedSubtitle: {
    fontSize: 14,
    color: "#666666", // Xám cho subtitle
  },
  feedbackSection: {
    marginBottom: 20, // Giảm margin để gần nút hơn
    flex: 1, // Để mở rộng
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000", // Đen cho section title
    marginBottom: 12,
  },
  feedbackCard: {
    backgroundColor: "#FAFAFA", // Xám rất nhạt cho feedback card
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    flex: 1,
    maxHeight: 600, // Tăng chiều cao để kéo gần cuối màn hình hơn
  },
  feedbackScroll: {
    flex: 1,
    maxHeight: 600,
  },
  feedbackText: {
    fontSize: 14,
    color: "#000000", // Đen cho feedback
    lineHeight: 20,
  },

  // Button Container for Completed Screen
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  secondaryButton: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  retakeButton: {
    // Giữ nguyên style cho retake
  },
  newButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },

  // Shared Button Styles
  primaryButton: {
    backgroundColor: "#e91e63",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});