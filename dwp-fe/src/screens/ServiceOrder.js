import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../utils/constant';

export default function ServiceOrder({ navigation }) {
  // Giả sử đây là một danh sách các thông báo đã đặt lịch thành công
  const notifications = [
    {
      id: 1,
      serviceName: "Cắt tóc",
      serviceDate: "10:00 AM, 15/02/2025",
      location: "Tiệm tóc ABC",
      status: "Đặt lịch thành công"
    },
    {
      id: 2,
      serviceName: "Massage",
      serviceDate: "2:00 PM, 16/02/2025",
      location: "Spa XYZ",
      status: "Đặt lịch thành công"
    },
    {
      id: 3,
      serviceName: "Chăm sóc da",
      serviceDate: "9:30 AM, 17/02/2025",
      location: "Beauty Center",
      status: "Đặt lịch thành công"
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="calendar-check" size={28} color={COLORS.WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Lịch đặt</Text>
            <Text style={styles.headerSubtitle}>Dịch vụ đã đặt</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationCard}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate('ServiceDetail', { serviceId: notification.id });
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="checkmark-circle" size={32} color={COLORS.SUCCESS} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {notification.serviceName}
                  </Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.GRAY} />
                    <Text style={styles.serviceDetails}>{notification.serviceDate}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.GRAY} />
                    <Text style={styles.serviceDetails} numberOfLines={1}>
                      {notification.location}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.SUCCESS} />
                  <Text style={styles.status}>{notification.status}</Text>
                </View>
                <View style={styles.viewDetailButton}>
                  <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.GRAY} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
            <Text style={styles.emptyText}>
              Bạn chưa có lịch đặt dịch vụ nào. Hãy đặt lịch để sử dụng dịch vụ!
            </Text>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: SPACING.MEDIUM,
    paddingBottom: SPACING.XLARGE,
  },
  notificationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MEDIUM,
  },
  cardIconContainer: {
    marginRight: SPACING.MEDIUM,
  },
  cardContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONTS.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.TINY,
    gap: 4,
  },
  serviceDetails: {
    flex: 1,
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    fontSize: FONTS.SMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontSize: FONTS.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
