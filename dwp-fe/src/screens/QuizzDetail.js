import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native"; // Giả sử dùng React Navigation cho params
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant"; // Giả sử có constant file

const QuizDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { quizId } = route.params || {}; // Lấy quizId từ navigation params
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quizId) {
      setError("Không tìm thấy ID bài kiểm tra");
      setLoading(false);
      return;
    }
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_ROOT}/quiz/${quizId}`);
      setQuiz(res.data);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError("Không thể tải chi tiết bài kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có thông tin";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (error || !quiz) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.ERROR} />
        <Text style={styles.errorText}>
          {error || "Không tìm thấy bài kiểm tra"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuizDetails}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()} // Giả sử có navigation prop
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {quiz.title || "Chi tiết bài kiểm tra"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Ngày tạo */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.GRAY} />
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>{formatDate(quiz.createdAt)}</Text>
          </View>

          {/* Mô tả */}
          {quiz.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{quiz.description}</Text>
            </View>
          )}

          {/* Câu hỏi */}
          {quiz.questions && quiz.questions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Câu hỏi & Đáp án</Text>
              {quiz.questions.map((q, index) => {
                const question = q.questionId;
                if (!question) return null;
                return (
                  <View key={index} style={styles.questionContainer}>
                    <Text style={styles.questionTitle}>
                      {index + 1}. {question.content}
                    </Text>
                    {question.options?.map((opt, optIndex) => {
                      const isSelected = q.answers?.includes(opt);
                      return (
                        <View key={optIndex} style={styles.optionContainer}>
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.selectedOption,
                            ]}
                          >
                            • {opt}
                            {isSelected && " (Đã chọn)"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* Nhận xét AI */}
          {quiz.commentAI && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kết quả khảo sát</Text>
              <Text style={styles.commentAI}>{quiz.commentAI}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND || "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY || "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.ERROR || "#d32f2f",
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY || "#1976d2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.PRIMARY || "#1976d2",
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 24,
  },
  contentContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT || "#333",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.GRAY || "#666",
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT || "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT || "#333",
    lineHeight: 24,
  },
  commentAI: {
    fontSize: 16,
    color: COLORS.TEXT || "#333",
    lineHeight: 24,
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
  },
  questionContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT || "#333",
    marginBottom: 12,
  },
  optionContainer: {
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.GRAY || "#666",
  },
  selectedOption: {
    fontWeight: "bold",
    color: COLORS.PRIMARY || "#1976d2",
  },
});

export default QuizDetail;
