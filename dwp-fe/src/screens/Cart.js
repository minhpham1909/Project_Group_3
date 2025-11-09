import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, MESSAGES, ROUTER } from '../utils/constant';
import { useCart } from '../utils/hooks';
import { formatPrice } from '../utils/helpers';

export default function Cart({ navigation }) {
  const { 
    cartItems, 
    loading, 
    error, 
    removeFromCart, 
    getTotalPrice, 
    getTotalItems,
    refreshCart
  } = useCart();

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => removeFromCart(itemId)
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{MESSAGES.LOADING}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshCart}
          >
            <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="cart-outline" size={64} color={COLORS.GRAY} />
              </View>
              <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
              <Text style={styles.emptyCartSubtext}>
                Thêm dịch vụ vào giỏ hàng để tiếp tục
              </Text>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate(ROUTER.HOME)}
                activeOpacity={0.8}
              >
                <Ionicons name="storefront-outline" size={20} color={COLORS.WHITE} />
                <Text style={styles.shopButtonText}>Tiếp tục mua sắm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Image
                    source={item.image || require('../../assets/massage.png')}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name || 'Dịch vụ'}
                    </Text>
                    <View style={styles.itemInfoRow}>
                      <Ionicons name="cash-outline" size={16} color={COLORS.PRIMARY} />
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.price || 0)} VND
                      </Text>
                    </View>
                    {item.time && (
                      <View style={styles.itemInfoRow}>
                        <Ionicons name="time-outline" size={16} color={COLORS.GRAY} />
                        <Text style={styles.itemTime}>{item.time}</Text>
                      </View>
                    )}
                    {item.storeName && (
                      <View style={styles.itemInfoRow}>
                        <Ionicons name="storefront-outline" size={16} color={COLORS.GRAY} />
                        <Text style={styles.itemStore} numberOfLines={1}>
                          {item.storeName}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.orderButton}
                      onPress={() => navigation.navigate(ROUTER.SERVICE_ORDER, { serviceId: item.id })}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar-outline" size={16} color={COLORS.WHITE} />
                      <Text style={styles.orderButtonText}>Đặt lịch</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.WHITE} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.totalSection}>
                <View style={styles.totalInfo}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Số lượng:</Text>
                    <Text style={styles.totalItemsValue}>{getTotalItems()} sản phẩm</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng:</Text>
                    <Text style={styles.totalText}>
                      {formatPrice(getTotalPrice())} VND
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={() => navigation.navigate(ROUTER.CREATE_ORDER, { cartItems, totalPrice: getTotalPrice() })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={24} color={COLORS.WHITE} />
                  <Text style={styles.checkoutButtonText}>Thanh toán</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    flex: 1,
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XLARGE,
    backgroundColor: COLORS.BACKGROUND,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.MEDIUM,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: SPACING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTS.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    lineHeight: 20,
  },
  itemInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.TINY,
    gap: 4,
  },
  itemPrice: {
    fontSize: FONTS.REGULAR,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  itemTime: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    flex: 1,
  },
  itemStore: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    flex: 1,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: SPACING.SMALL,
    gap: 4,
  },
  orderButtonText: {
    fontSize: FONTS.SMALL,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: COLORS.ERROR,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  emptyCart: {
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
  emptyCartText: {
    fontSize: FONTS.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  emptyCartSubtext: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    marginBottom: SPACING.LARGE,
    textAlign: 'center',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    gap: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shopButtonText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  totalSection: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LARGE,
    borderRadius: 16,
    marginTop: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalInfo: {
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SMALL,
  },
  totalLabel: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  totalItemsValue: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  totalText: {
    fontSize: FONTS.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SECONDARY,
    padding: SPACING.LARGE,
    borderRadius: 16,
    gap: SPACING.SMALL,
    shadowColor: COLORS.SECONDARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonText: {
    fontSize: FONTS.LARGE,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  errorText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.ERROR,
    marginTop: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LARGE,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    gap: SPACING.SMALL,
  },
  retryButtonText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});