import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../utils/constant';

export default function CheckList({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Danh sách kiểm tra</Text>
            <Text style={styles.headerSubtitle}>Quản lý kiểm tra</Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="list-outline" size={64} color={COLORS.GRAY} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có danh sách kiểm tra</Text>
          <Text style={styles.emptyText}>
            Tính năng này đang được phát triển. Vui lòng quay lại sau!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    paddingHorizontal: SPACING.LARGE,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MEDIUM,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: FONTS.SMALL,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XLARGE * 2,
    paddingHorizontal: SPACING.XLARGE,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: 'center',
    lineHeight: 22,
  },
});
