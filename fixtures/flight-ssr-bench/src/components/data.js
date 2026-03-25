const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Food',
  'Health',
];
const statuses = ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'];
const activityTypes = [
  'order_placed',
  'order_shipped',
  'order_delivered',
  'refund_requested',
  'review_posted',
  'product_added',
  'stock_alert',
  'payment_received',
];
const userNames = [
  'Alice Johnson',
  'Bob Williams',
  'Carol Davis',
  'Dan Miller',
  'Eve Wilson',
  'Frank Moore',
  'Grace Taylor',
  'Henry Anderson',
  'Iris Thomas',
  'Jack Jackson',
];

export function generateProducts(count) {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      id: i,
      name: 'Product ' + i,
      sku: 'SKU-' + String(i).padStart(6, '0'),
      price: ((i * 17 + 3) % 9999 / 100).toFixed(2),
      category: categories[i % categories.length],
      status: statuses[i % statuses.length],
      stock: (i * 7 + 13) % 500,
      rating: (((i * 3 + 1) % 50) / 10).toFixed(1),
      reviews: (i * 13 + 5) % 200,
      description:
        'This is a detailed description for product ' +
        i +
        '. It includes specifications, features, and other relevant information that a customer might need.',
      tags: [
        categories[(i + 1) % categories.length].toLowerCase(),
        i % 2 === 0 ? 'featured' : 'new',
        i % 3 === 0 ? 'sale' : 'regular',
      ],
      dimensions: {
        weight: ((i * 3 + 1) % 100) / 10,
        width: ((i * 7 + 2) % 50) + 5,
        height: ((i * 11 + 3) % 40) + 5,
        depth: ((i * 13 + 4) % 30) + 2,
      },
      supplier: {
        name: 'Supplier ' + (i % 20),
        leadTime: (i % 14) + 1 + ' days',
        minOrder: ((i * 3) % 50) + 10,
      },
    });
  }
  return products;
}

export function generateActivities(count) {
  const activities = [];
  for (let i = 0; i < count; i++) {
    activities.push({
      id: i,
      type: activityTypes[i % activityTypes.length],
      user: userNames[i % userNames.length],
      timestamp: '2026-03-' + String((i % 28) + 1).padStart(2, '0'),
      details: {
        orderId: '#' + String(10000 + i),
        amount: '$' + ((i * 23 + 7) % 999).toFixed(2),
        items: ((i * 3 + 1) % 5) + 1,
      },
      message:
        userNames[i % userNames.length] +
        ' ' +
        activityTypes[i % activityTypes.length].replace(/_/g, ' ') +
        ' for order #' +
        (10000 + i),
    });
  }
  return activities;
}

export function generateStats() {
  return {
    totalRevenue: '$1,284,320.50',
    totalOrders: 8432,
    totalCustomers: 3841,
    conversionRate: '3.2%',
    avgOrderValue: '$152.30',
    returnsRate: '2.1%',
    cards: [
      {
        title: 'Total Revenue',
        value: '$1,284,320',
        change: '+12.5%',
        trend: 'up',
        sparkline: [65, 59, 80, 81, 56, 55, 72, 84, 91, 88, 95, 102],
      },
      {
        title: 'Orders',
        value: '8,432',
        change: '+8.2%',
        trend: 'up',
        sparkline: [28, 48, 40, 19, 86, 27, 90, 65, 72, 81, 56, 88],
      },
      {
        title: 'Customers',
        value: '3,841',
        change: '+4.1%',
        trend: 'up',
        sparkline: [12, 19, 25, 32, 28, 35, 42, 38, 45, 51, 48, 55],
      },
      {
        title: 'Conversion Rate',
        value: '3.2%',
        change: '-0.3%',
        trend: 'down',
        sparkline: [3.8, 3.5, 3.2, 3.6, 3.1, 3.4, 3.0, 3.3, 3.5, 3.2, 3.1, 3.2],
      },
    ],
    revenueByMonth: [
      {month: 'Jan', value: 85000},
      {month: 'Feb', value: 92000},
      {month: 'Mar', value: 88000},
      {month: 'Apr', value: 105000},
      {month: 'May', value: 112000},
      {month: 'Jun', value: 98000},
      {month: 'Jul', value: 115000},
      {month: 'Aug', value: 108000},
      {month: 'Sep', value: 120000},
      {month: 'Oct', value: 118000},
      {month: 'Nov', value: 125000},
      {month: 'Dec', value: 118320},
    ],
    topCategories: [
      {name: 'Electronics', revenue: 420000, orders: 2800},
      {name: 'Clothing', revenue: 310000, orders: 2100},
      {name: 'Home & Garden', revenue: 225000, orders: 1500},
      {name: 'Sports', revenue: 180000, orders: 1200},
      {name: 'Books', revenue: 149320, orders: 832},
    ],
  };
}
