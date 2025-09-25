import { Card } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
  Package,
  Pill,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  FileText,
  Utensils,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Supplement {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  inStock: boolean;
  isRecommended: boolean;
  dosage: string;
  frequency: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'delivered' | 'shipped' | 'processing' | 'cancelled';
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillsRemaining: number;
  nextRefillDate: string;
  doctor: string;
  pharmacy: string;
  price: number;
  isRefillable: boolean;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  prepTime: string;
  calories: number;
  isAvailable: boolean;
  isRecommended: boolean;
  image?: string;
}

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'products' | 'supplements' | 'rx' | 'meals'>('products');

  const statusFilters = [
    { id: 'all', name: 'All Orders', icon: ShoppingBag },
    { id: 'processing', name: 'Processing', icon: Clock },
    { id: 'shipped', name: 'Shipped', icon: Truck },
    { id: 'delivered', name: 'Delivered', icon: CheckCircle },
  ];

  const supplementCategories = [
    { id: 'all', name: 'All', icon: Pill },
    { id: 'vitamins', name: 'Vitamins', icon: Heart },
    { id: 'minerals', name: 'Minerals', icon: Star },
    { id: 'protein', name: 'Protein', icon: TrendingUp },
  ];

  const supplements: Supplement[] = [
    {
      id: 's1',
      name: 'Vitamin D3',
      category: 'vitamins',
      description: 'Essential for bone health and immune system support',
      price: 24.99,
      rating: 4.8,
      inStock: true,
      isRecommended: true,
      dosage: '1000 IU',
      frequency: 'Daily',
    },
    {
      id: 's2',
      name: 'Omega-3 Fish Oil',
      category: 'vitamins',
      description: 'Supports heart health and brain function',
      price: 32.5,
      rating: 4.6,
      inStock: true,
      isRecommended: true,
      dosage: '1000mg',
      frequency: 'Twice daily',
    },
    {
      id: 's3',
      name: 'Vitamin B3 (Niacin)',
      category: 'vitamins',
      description: 'Supports energy metabolism and cardiovascular health',
      price: 18.99,
      rating: 4.5,
      inStock: true,
      isRecommended: true,
      dosage: '500mg',
      frequency: 'Daily',
    },
    {
      id: 's4',
      name: 'Magnesium',
      category: 'minerals',
      description: 'Supports muscle and nerve function',
      price: 21.99,
      rating: 4.4,
      inStock: true,
      isRecommended: false,
      dosage: '400mg',
      frequency: 'Daily',
    },
  ];

  const prescriptions: Prescription[] = [
    {
      id: '1',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      refillsRemaining: 2,
      nextRefillDate: '2025-09-15',
      doctor: 'Dr. Sarah Johnson',
      pharmacy: 'CVS Pharmacy',
      price: 15.99,
      isRefillable: true,
    },
    {
      id: '2',
      name: 'Rosuvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      refillsRemaining: 3,
      nextRefillDate: '2025-09-21',
      doctor: 'Dr. Sarah Johnson',
      pharmacy: 'CVS Pharmacy',
      price: 18.5,
      isRefillable: true,
    },
    {
      id: '3',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      refillsRemaining: 0,
      nextRefillDate: '2025-09-20',
      doctor: 'Dr. Michael Chen',
      pharmacy: 'Walgreens',
      price: 8.5,
      isRefillable: false,
    },
    {
      id: '4',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      refillsRemaining: 1,
      nextRefillDate: '2025-09-27',
      doctor: 'Dr. Sarah Johnson',
      pharmacy: 'CVS Pharmacy',
      price: 12.75,
      isRefillable: true,
    },
  ];

  const meals: Meal[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      description: 'Fresh quinoa with grilled vegetables, olives, and feta cheese',
      category: 'healthy',
      price: 14.99,
      rating: 4.8,
      prepTime: '15 min',
      calories: 420,
      isAvailable: true,
      isRecommended: true,
    },
    {
      id: '2',
      name: 'Grilled Salmon with Sweet Potato',
      description: 'Atlantic salmon with roasted sweet potato and steamed broccoli',
      category: 'protein',
      price: 18.5,
      rating: 4.9,
      prepTime: '25 min',
      calories: 380,
      isAvailable: true,
      isRecommended: true,
    },
    {
      id: '3',
      name: 'Veggie Power Smoothie',
      description: 'Kale, spinach, banana, and protein powder blend',
      category: 'smoothie',
      price: 9.99,
      rating: 4.6,
      prepTime: '5 min',
      calories: 280,
      isAvailable: true,
      isRecommended: false,
    },
    {
      id: '4',
      name: 'Chicken Caesar Salad',
      description: 'Grilled chicken breast with romaine lettuce and caesar dressing',
      category: 'salad',
      price: 12.99,
      rating: 4.4,
      prepTime: '10 min',
      calories: 320,
      isAvailable: false,
      isRecommended: false,
    },
  ];

  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      date: '2025-09-15',
      status: 'delivered',
      total: 249.97,
      items: [
        { id: '1', name: 'Whey Protein', quantity: 1, price: 24.99 },
        { id: '2', name: 'Air Purifier', quantity: 1, price: 159.99 },
        { id: '4', name: 'Pulse Oximeter', quantity: 1, price: 39.99 },
      ],
      trackingNumber: '1Z999AA1234567890',
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      date: '2025-09-19',
      status: 'shipped',
      total: 89.99,
      items: [{ id: '5', name: 'Digital Blood Pressure Monitor', quantity: 1, price: 89.99 }],
      trackingNumber: '1Z999AA1234567891',
      estimatedDelivery: '2025-09-22',
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      date: '2025-09-17',
      status: 'processing',
      total: 269.97,
      items: [
        { id: '6', name: 'Smart Fitness Tracker', quantity: 1, price: 129.99 },
        { id: '5', name: 'Digital Blood Pressure Monitor', quantity: 1, price: 89.99 },
        { id: '7', name: 'UV Sanitizer Box', quantity: 1, price: 49.99 },
      ],
    },
  ];

  const filteredOrders = selectedStatus === 'all' ? orders : orders.filter((o) => o.status === selectedStatus);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'processing':
        return Clock;
      case 'cancelled':
        return RefreshCw;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      {/* Fixed Header */}
      <View>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
            backgroundColor: isDarkMode ? '#111827' : '#ffffff',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            zIndex: 10,
          }}
        >
          {/* Title Section */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
              }}
            >
              {activeTab === 'products' ? (
                <ShoppingBag size={22} color="#fff" />
              ) : activeTab === 'supplements' ? (
                <Pill size={22} color="#fff" />
              ) : activeTab === 'rx' ? (
                <FileText size={22} color="#fff" />
              ) : (
                <Utensils size={22} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 2,
                }}
              >
                {activeTab === 'products'
                  ? 'Products'
                  : activeTab === 'supplements'
                    ? 'Supplements'
                    : activeTab === 'rx'
                      ? 'RX'
                      : 'Meals'}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }}
              >
                {activeTab === 'products'
                  ? 'Track your purchases'
                  : activeTab === 'supplements'
                    ? 'Your health essentials'
                    : activeTab === 'rx'
                      ? 'Manage your prescriptions'
                      : 'Order healthy meals'}
              </Text>
            </View>
          </View>

          {/* Tab Navigation - Full Width */}
          <View style={{ flexDirection: 'column', gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('products')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'products' ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6',
                }}
                activeOpacity={0.7}
              >
                <View style={{ marginRight: 6 }}>
                  <ShoppingBag
                    size={16}
                    color={activeTab === 'products' ? '#ffffff' : isDarkMode ? '#9ca3af' : '#6b7280'}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'products' ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                  }}
                >
                  Products
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('supplements')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'supplements' ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6',
                }}
                activeOpacity={0.7}
              >
                <View style={{ marginRight: 6 }}>
                  <Pill
                    size={16}
                    color={activeTab === 'supplements' ? '#ffffff' : isDarkMode ? '#9ca3af' : '#6b7280'}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'supplements' ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                  }}
                >
                  Supplements
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('rx')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'rx' ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6',
                }}
                activeOpacity={0.7}
              >
                <View style={{ marginRight: 6 }}>
                  <FileText size={16} color={activeTab === 'rx' ? '#ffffff' : isDarkMode ? '#9ca3af' : '#6b7280'} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'rx' ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                  }}
                >
                  RX
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('meals')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'meals' ? '#10b981' : isDarkMode ? '#374151' : '#f3f4f6',
                }}
                activeOpacity={0.7}
              >
                <View style={{ marginRight: 6 }}>
                  <Utensils size={16} color={activeTab === 'meals' ? '#ffffff' : isDarkMode ? '#9ca3af' : '#6b7280'} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'meals' ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                  }}
                >
                  Meals
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{
            height: '100%',
            backgroundColor: isDarkMode ? '#111827' : '#F0FDF4',
          }}
          contentContainerStyle={{ paddingBottom: 400 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
            {activeTab === 'products' ? (
              /* Status Filters */
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    gap: 12,
                  }}
                >
                  {statusFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      onPress={() => setSelectedStatus(filter.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: selectedStatus === filter.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                        backgroundColor: selectedStatus === filter.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                        minWidth: 120,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ marginRight: 6 }}>
                        <filter.icon
                          size={18}
                          color={selectedStatus === filter.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: selectedStatus === filter.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                        }}
                      >
                        {filter.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : activeTab === 'supplements' ? (
              /* Categories */
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    gap: 12,
                  }}
                >
                  {supplementCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: selectedCategory === category.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                        backgroundColor:
                          selectedCategory === category.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                        minWidth: 100,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ marginRight: 6 }}>
                        <category.icon
                          size={18}
                          color={selectedCategory === category.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: selectedCategory === category.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                        }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : activeTab === 'rx' ? (
              /* RX Status Filters */
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    gap: 12,
                  }}
                >
                  {[
                    { id: 'all', name: 'All RX', icon: FileText },
                    { id: 'refillable', name: 'Refillable', icon: RefreshCw },
                    { id: 'expired', name: 'Expired', icon: Clock },
                  ].map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      onPress={() => setSelectedStatus(filter.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: selectedStatus === filter.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                        backgroundColor: selectedStatus === filter.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                        minWidth: 120,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ marginRight: 6 }}>
                        <filter.icon
                          size={18}
                          color={selectedStatus === filter.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: selectedStatus === filter.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                        }}
                      >
                        {filter.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              /* Meal Categories */
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    gap: 12,
                  }}
                >
                  {[
                    { id: 'all', name: 'All Meals', icon: Utensils },
                    { id: 'healthy', name: 'Healthy', icon: Heart },
                    { id: 'protein', name: 'Protein', icon: TrendingUp },
                    { id: 'smoothie', name: 'Smoothies', icon: Star },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: selectedCategory === category.id ? '#10b981' : isDarkMode ? '#374151' : '#d1d5db',
                        backgroundColor:
                          selectedCategory === category.id ? '#10b981' : isDarkMode ? '#1f2937' : '#ffffff',
                        minWidth: 100,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ marginRight: 6 }}>
                        <category.icon
                          size={18}
                          color={selectedCategory === category.id ? '#fff' : isDarkMode ? '#9ca3af' : '#64748b'}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: selectedCategory === category.id ? '#ffffff' : isDarkMode ? '#d1d5db' : '#374151',
                        }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Time to Reorder Section */}
            {(activeTab === 'products' && orders.filter((order) => order.status === 'delivered').length > 0) ||
            activeTab === 'supplements' ||
            activeTab === 'rx' ||
            activeTab === 'meals' ? (
              <View
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ marginRight: 8 }}>
                        <Star size={22} color="#fbbf24" />
                      </View>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '600',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        }}
                      >
                        Time to Reorder?
                      </Text>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {activeTab === 'products' &&
                      orders
                        .filter((order) => order.status === 'delivered')
                        .flatMap((order) => order.items)
                        .slice(0, 3)
                        .map((item) => (
                          <View
                            key={item.id}
                            style={{
                              marginRight: 16,
                              padding: 16,
                              borderRadius: 12,
                              width: 280,
                              backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : '#d1fae5',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.5)' : '#a7f3d0',
                                }}
                              >
                                <Package size={22} color={isDarkMode ? '#34d399' : '#059669'} />
                              </View>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '600',
                                  color: isDarkMode ? '#34d399' : '#059669',
                                }}
                              >
                                ${item.price.toFixed(2)}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '500',
                                marginBottom: 6,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              }}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                marginBottom: 12,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                              }}
                            >
                              Last ordered quantity: {item.quantity}
                            </Text>
                            <TouchableOpacity
                              style={{
                                paddingVertical: 12,
                                borderRadius: 12,
                                backgroundColor: '#10b981',
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  color: '#ffffff',
                                  textAlign: 'center',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}
                              >
                                Quick Reorder
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                    {activeTab === 'supplements' &&
                      supplements
                        .filter((s) => s.isRecommended)
                        .slice(0, 3)
                        .map((supplement) => (
                          <View
                            key={supplement.id}
                            style={{
                              marginRight: 16,
                              padding: 16,
                              borderRadius: 12,
                              width: 280,
                              backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : '#d1fae5',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.5)' : '#a7f3d0',
                                }}
                              >
                                <Pill size={22} color={isDarkMode ? '#34d399' : '#059669'} />
                              </View>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '600',
                                  color: isDarkMode ? '#34d399' : '#059669',
                                }}
                              >
                                ${supplement.price.toFixed(2)}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '500',
                                marginBottom: 6,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              }}
                            >
                              {supplement.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                marginBottom: 12,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                              }}
                            >
                              {supplement.dosage} • {supplement.frequency}
                            </Text>
                            <TouchableOpacity
                              style={{
                                paddingVertical: 12,
                                borderRadius: 12,
                                backgroundColor: '#10b981',
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  color: '#ffffff',
                                  textAlign: 'center',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}
                              >
                                Quick Reorder
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                    {activeTab === 'rx' &&
                      prescriptions
                        .filter((p) => p.name === 'Metformin' || p.name === 'Rosuvastatin')
                        .map((prescription) => (
                          <View
                            key={prescription.id}
                            style={{
                              marginRight: 16,
                              padding: 16,
                              borderRadius: 12,
                              width: 280,
                              backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : '#d1fae5',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.5)' : '#a7f3d0',
                                }}
                              >
                                <FileText size={22} color={isDarkMode ? '#34d399' : '#059669'} />
                              </View>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '600',
                                  color: isDarkMode ? '#34d399' : '#059669',
                                }}
                              >
                                ${prescription.price.toFixed(2)}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '500',
                                marginBottom: 6,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              }}
                            >
                              {prescription.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                marginBottom: 12,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                              }}
                            >
                              {prescription.dosage} • {prescription.frequency}
                            </Text>
                            <TouchableOpacity
                              style={{
                                paddingVertical: 12,
                                borderRadius: 12,
                                backgroundColor: '#10b981',
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  color: '#ffffff',
                                  textAlign: 'center',
                                  fontSize: 14,
                                  fontWeight: '500',
                                }}
                              >
                                Quick Reorder
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                    {activeTab === 'meals' &&
                      meals.slice(0, 3).map((meal) => (
                        <View
                          key={meal.id}
                          style={{
                            marginRight: 16,
                            padding: 16,
                            borderRadius: 12,
                            width: 280,
                            backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.3)' : '#d1fae5',
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 12,
                            }}
                          >
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.5)' : '#a7f3d0',
                              }}
                            >
                              <Utensils size={22} color={isDarkMode ? '#34d399' : '#059669'} />
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: isDarkMode ? '#34d399' : '#059669',
                              }}
                            >
                              ${meal.price.toFixed(2)}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '500',
                              marginBottom: 6,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            }}
                          >
                            {meal.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              marginBottom: 12,
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                            }}
                          >
                            {meal.calories} cal • {meal.prepTime}
                          </Text>
                          <TouchableOpacity
                            style={{
                              paddingVertical: 12,
                              borderRadius: 12,
                              backgroundColor: '#10b981',
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: '#ffffff',
                                textAlign: 'center',
                                fontSize: 14,
                                fontWeight: '500',
                              }}
                            >
                              Order Again
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {activeTab === 'products' ? (
              <>
                {/* Orders List */}
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <View
                      key={order.id}
                      style={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDarkMode ? 0.3 : 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <View>
                        {/* Order Header */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                marginBottom: 4,
                              }}
                            >
                              {order.orderNumber}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                              }}
                            >
                              {order.date}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: isDarkMode ? '#34d399' : '#059669',
                                marginBottom: 4,
                              }}
                            >
                              ${order.total.toFixed(2)}
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <View style={{ marginRight: 4 }}>
                                <StatusIcon size={16} color={isDarkMode ? '#60a5fa' : '#9ca3af'} />
                              </View>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: '500',
                                  color: isDarkMode ? '#60a5fa' : '#6b7280',
                                }}
                              >
                                {getStatusText(order.status)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Order Items */}
                        <View className="mb-3 space-y-2">
                          {order.items.map((item) => (
                            <View
                              key={item.id}
                              className={`flex-row items-center justify-between rounded-lg p-2 ${
                                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                              }`}
                            >
                              <View className="flex-row items-center">
                                <View
                                  className={`mr-2 h-8 w-8 items-center justify-center rounded ${
                                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <Package size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                                </View>
                                <View>
                                  <Text className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                    {item.name}
                                  </Text>
                                  <View className="flex-row items-center space-x-2">
                                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Qty: {item.quantity}
                                    </Text>
                                    <Text className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                      •
                                    </Text>
                                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      ${item.price.toFixed(2)} each
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <Text className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                ${(item.price * item.quantity).toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Tracking Info */}
                        {order.trackingNumber && (
                          <View className={`mb-3 rounded-lg p-3 ${isDarkMode ? 'bg-emerald-950/50' : 'bg-emerald-50'}`}>
                            <Text
                              className={`mb-1 text-sm font-medium ${
                                isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
                              }`}
                            >
                              Tracking Information
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              Tracking #: {order.trackingNumber}
                            </Text>
                            {order.estimatedDelivery && (
                              <Text className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                Estimated Delivery: {order.estimatedDelivery}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Action Buttons */}
                        <View className="flex-row space-x-2">
                          <TouchableOpacity
                            className={`flex-1 rounded-lg py-2 ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-600'}`}
                          >
                            <Text className="text-center font-medium text-white">Track Order</Text>
                          </TouchableOpacity>
                          {order.status === 'delivered' && (
                            <TouchableOpacity
                              className={`flex-1 rounded-lg py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              <Text
                                className={`text-center font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}
                              >
                                Reorder
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity className={`rounded-lg p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <ArrowRight size={16} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                  <View
                    style={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      borderRadius: 16,
                      padding: 32,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View style={{ marginBottom: 16 }}>
                      <ShoppingBag size={48} color={isDarkMode ? '#374151' : '#d1d5db'} />
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        marginBottom: 8,
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      }}
                    >
                      No Orders Found
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        textAlign: 'center',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      {selectedStatus === 'all'
                        ? "You haven't placed any orders yet."
                        : `No ${selectedStatus} orders found.`}
                    </Text>
                  </View>
                )}
              </>
            ) : activeTab === 'supplements' ? (
              <>
                {/* Recommended Section */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center">
                      <Star size={20} color="#fbbf24" className="mr-2" />
                      <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        Recommended for You
                      </Text>
                    </View>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Based on your health profile and recent activity
                    </Text>
                    {supplements
                      .filter((s) => s.isRecommended)
                      .map((supplement) => (
                        <View
                          key={supplement.id}
                          className={`mb-2 flex-row items-center rounded-lg p-3 ${
                            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
                          }`}
                        >
                          <View
                            className={`mr-3 h-12 w-12 items-center justify-center rounded-lg ${
                              isDarkMode ? 'bg-emerald-800/50' : 'bg-emerald-100'
                            }`}
                          >
                            <Pill size={24} color={isDarkMode ? '#34d399' : '#059669'} />
                          </View>
                          <View className="flex-1">
                            <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {supplement.name}
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {supplement.description}
                            </Text>
                            <View className="mt-1 flex-row items-center">
                              <View className="mr-2 flex-row items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    color={i < Math.floor(supplement.rating) ? '#fbbf24' : '#d1d5db'}
                                    fill={i < Math.floor(supplement.rating) ? '#fbbf24' : 'none'}
                                  />
                                ))}
                              </View>
                              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                ({supplement.rating})
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              ${supplement.price.toFixed(2)}
                            </Text>
                            <TouchableOpacity
                              className={`mt-1 rounded-full px-3 py-1 ${
                                isDarkMode ? 'bg-emerald-700' : 'bg-emerald-600'
                              }`}
                            >
                              <Text className="text-xs font-medium text-white">Add</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>

                {/* All Supplements */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <Text className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      All Supplements
                    </Text>
                    {supplements
                      .filter((s) => selectedCategory === 'all' || s.category === selectedCategory)
                      .map((supplement) => (
                        <View
                          key={supplement.id}
                          className={`mb-4 border-b pb-4 last:border-b-0 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-100'
                          }`}
                        >
                          <View className="flex-row items-start">
                            <View
                              className={`mr-3 h-16 w-16 items-center justify-center rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              <Pill size={28} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center justify-between">
                                <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                  {supplement.name}
                                </Text>
                                <Text
                                  className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                                >
                                  ${supplement.price.toFixed(2)}
                                </Text>
                              </View>
                              <Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {supplement.description}
                              </Text>
                              <View className="mt-2 flex-row items-center space-x-4">
                                <View className="flex-row items-center">
                                  <Clock size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {supplement.frequency}
                                  </Text>
                                </View>
                                <View className="flex-row items-center">
                                  <Pill size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {supplement.dosage}
                                  </Text>
                                </View>
                              </View>
                              <View className="mt-2 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      color={i < Math.floor(supplement.rating) ? '#fbbf24' : '#d1d5db'}
                                      fill={i < Math.floor(supplement.rating) ? '#fbbf24' : 'none'}
                                    />
                                  ))}
                                  <Text className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ({supplement.rating})
                                  </Text>
                                </View>
                                <View className="flex-row items-center space-x-2">
                                  {!supplement.inStock && <Text className="text-xs text-red-500">Out of Stock</Text>}
                                  <TouchableOpacity
                                    className={`rounded-full px-3 py-1 ${
                                      supplement.inStock
                                        ? isDarkMode
                                          ? 'bg-emerald-700'
                                          : 'bg-emerald-600'
                                        : isDarkMode
                                          ? 'bg-gray-700'
                                          : 'bg-gray-300'
                                    }`}
                                    disabled={!supplement.inStock}
                                  >
                                    <Text
                                      className={`text-xs font-medium ${
                                        supplement.inStock
                                          ? 'text-white'
                                          : isDarkMode
                                            ? 'text-gray-400'
                                            : 'text-gray-500'
                                      }`}
                                    >
                                      {supplement.inStock ? 'Add to Cart' : 'Unavailable'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>
              </>
            ) : activeTab === 'rx' ? (
              <>
                {/* RX Refillable Section */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center">
                      <RefreshCw size={20} color="#10b981" className="mr-2" />
                      <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        Refillable Prescriptions
                      </Text>
                    </View>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Prescriptions ready for refill
                    </Text>
                    {prescriptions
                      .filter((p) => p.isRefillable)
                      .map((prescription) => (
                        <View
                          key={prescription.id}
                          className={`mb-3 flex-row items-center rounded-lg p-3 ${
                            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                          }`}
                        >
                          <View
                            className={`mr-3 h-12 w-12 items-center justify-center rounded-lg ${
                              isDarkMode ? 'bg-blue-800/50' : 'bg-blue-100'
                            }`}
                          >
                            <FileText size={24} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
                          </View>
                          <View className="flex-1">
                            <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {prescription.name}
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {prescription.dosage} • {prescription.frequency}
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Dr. {prescription.doctor.split(' ')[1]} • {prescription.pharmacy}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              ${prescription.price.toFixed(2)}
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {prescription.refillsRemaining} refills left
                            </Text>
                            <TouchableOpacity
                              className={`mt-1 rounded-full px-3 py-1 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}
                            >
                              <Text className="text-xs font-medium text-white">Refill</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>

                {/* All Prescriptions */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <Text className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      All Prescriptions
                    </Text>
                    {prescriptions
                      .filter(
                        (p) =>
                          selectedStatus === 'all' ||
                          (selectedStatus === 'refillable' && p.isRefillable) ||
                          (selectedStatus === 'expired' && !p.isRefillable),
                      )
                      .map((prescription) => (
                        <View
                          key={prescription.id}
                          className={`mb-4 border-b pb-4 last:border-b-0 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-100'
                          }`}
                        >
                          <View className="flex-row items-start">
                            <View
                              className={`mr-3 h-16 w-16 items-center justify-center rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              <FileText size={28} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center justify-between">
                                <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                  {prescription.name}
                                </Text>
                                <Text className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  ${prescription.price.toFixed(2)}
                                </Text>
                              </View>
                              <Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {prescription.dosage} • {prescription.frequency}
                              </Text>
                              <Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Dr. {prescription.doctor.split(' ')[1]} • {prescription.pharmacy}
                              </Text>
                              <View className="mt-2 flex-row items-center space-x-4">
                                <View className="flex-row items-center">
                                  <RefreshCw size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {prescription.refillsRemaining} refills
                                  </Text>
                                </View>
                                <View className="flex-row items-center">
                                  <Clock size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Next: {prescription.nextRefillDate}
                                  </Text>
                                </View>
                              </View>
                              <View className="mt-2 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {prescription.isRefillable ? 'Ready for refill' : 'Needs doctor approval'}
                                  </Text>
                                </View>
                                <View className="flex-row items-center space-x-2">
                                  <TouchableOpacity
                                    className={`rounded-full px-3 py-1 ${
                                      prescription.isRefillable
                                        ? isDarkMode
                                          ? 'bg-blue-700'
                                          : 'bg-blue-600'
                                        : isDarkMode
                                          ? 'bg-gray-700'
                                          : 'bg-gray-300'
                                    }`}
                                    disabled={!prescription.isRefillable}
                                  >
                                    <Text
                                      className={`text-xs font-medium ${
                                        prescription.isRefillable
                                          ? 'text-white'
                                          : isDarkMode
                                            ? 'text-gray-400'
                                            : 'text-gray-500'
                                      }`}
                                    >
                                      {prescription.isRefillable ? 'Refill Now' : 'Contact Doctor'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>
              </>
            ) : (
              <>
                {/* Recommended Meals */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <View className="mb-3 flex-row items-center">
                      <Star size={20} color="#fbbf24" className="mr-2" />
                      <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        Recommended Meals
                      </Text>
                    </View>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Based on your health goals and preferences
                    </Text>
                    {meals
                      .filter((m) => m.isRecommended)
                      .map((meal) => (
                        <View
                          key={meal.id}
                          className={`mb-2 flex-row items-center rounded-lg p-3 ${
                            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
                          }`}
                        >
                          <View
                            className={`mr-3 h-12 w-12 items-center justify-center rounded-lg ${
                              isDarkMode ? 'bg-emerald-800/50' : 'bg-emerald-100'
                            }`}
                          >
                            <Utensils size={24} color={isDarkMode ? '#34d399' : '#059669'} />
                          </View>
                          <View className="flex-1">
                            <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {meal.name}
                            </Text>
                            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {meal.description}
                            </Text>
                            <View className="mt-1 flex-row items-center">
                              <View className="mr-2 flex-row items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    color={i < Math.floor(meal.rating) ? '#fbbf24' : '#d1d5db'}
                                    fill={i < Math.floor(meal.rating) ? '#fbbf24' : 'none'}
                                  />
                                ))}
                              </View>
                              <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                ({meal.rating}) • {meal.calories} cal • {meal.prepTime}
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              ${meal.price.toFixed(2)}
                            </Text>
                            <TouchableOpacity
                              className={`mt-1 rounded-full px-3 py-1 ${
                                meal.isAvailable
                                  ? isDarkMode
                                    ? 'bg-emerald-700'
                                    : 'bg-emerald-600'
                                  : isDarkMode
                                    ? 'bg-gray-700'
                                    : 'bg-gray-300'
                              }`}
                              disabled={!meal.isAvailable}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  meal.isAvailable ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                {meal.isAvailable ? 'Order' : 'Unavailable'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>

                {/* All Meals */}
                <Card className={`border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="p-4">
                    <Text className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      All Meals
                    </Text>
                    {meals
                      .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
                      .map((meal) => (
                        <View
                          key={meal.id}
                          className={`mb-4 border-b pb-4 last:border-b-0 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-100'
                          }`}
                        >
                          <View className="flex-row items-start">
                            <View
                              className={`mr-3 h-16 w-16 items-center justify-center rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              <Utensils size={28} color={isDarkMode ? '#9ca3af' : '#64748b'} />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center justify-between">
                                <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                  {meal.name}
                                </Text>
                                <Text
                                  className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                                >
                                  ${meal.price.toFixed(2)}
                                </Text>
                              </View>
                              <Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {meal.description}
                              </Text>
                              <View className="mt-2 flex-row items-center space-x-4">
                                <View className="flex-row items-center">
                                  <Clock size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {meal.prepTime}
                                  </Text>
                                </View>
                                <View className="flex-row items-center">
                                  <Heart size={12} color={isDarkMode ? '#9ca3af' : '#64748b'} className="mr-1" />
                                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {meal.calories} cal
                                  </Text>
                                </View>
                              </View>
                              <View className="mt-2 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      color={i < Math.floor(meal.rating) ? '#fbbf24' : '#d1d5db'}
                                      fill={i < Math.floor(meal.rating) ? '#fbbf24' : 'none'}
                                    />
                                  ))}
                                  <Text className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ({meal.rating})
                                  </Text>
                                </View>
                                <View className="flex-row items-center space-x-2">
                                  {!meal.isAvailable && <Text className="text-xs text-red-500">Unavailable</Text>}
                                  <TouchableOpacity
                                    className={`rounded-full px-3 py-1 ${
                                      meal.isAvailable
                                        ? isDarkMode
                                          ? 'bg-emerald-700'
                                          : 'bg-emerald-600'
                                        : isDarkMode
                                          ? 'bg-gray-700'
                                          : 'bg-gray-300'
                                    }`}
                                    disabled={!meal.isAvailable}
                                  >
                                    <Text
                                      className={`text-xs font-medium ${
                                        meal.isAvailable ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`}
                                    >
                                      {meal.isAvailable ? 'Order Now' : 'Unavailable'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
