/**
 * Calculate estimated delivery date
 * Excludes weekends and adds business days
 */
const calculateDeliveryDate = (shippingSpeed = 'standard') => {
  // Delivery times in business days
  const deliveryDays = {
    'standard': 5,    // 5 business days
    'express': 2,     // 2 business days
    'overnight': 1    // 1 business day
  };

  const daysToAdd = deliveryDays[shippingSpeed] || 5;
  const currentDate = new Date();
  let businessDaysAdded = 0;
  let estimatedDate = new Date(currentDate);

  // Add business days (skip weekends)
  while (businessDaysAdded < daysToAdd) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
    
    // Check if it's a weekday (Monday = 1, Sunday = 0)
    const dayOfWeek = estimatedDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  return {
    estimatedDeliveryDate: estimatedDate,
    deliveryDays: daysToAdd
  };
};

/**
 * Generate tracking number
 */
const generateTrackingNumber = () => {
  const prefix = 'UNICA';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format delivery date for display
 */
const formatDeliveryDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get delivery status message
 */
const getDeliveryStatusMessage = (status) => {
  const messages = {
    'pending': 'Order received - Processing',
    'processing': 'Preparing for shipment',
    'shipped': 'Package shipped',
    'in_transit': 'On the way to you',
    'out_for_delivery': 'Out for delivery today',
    'delivered': 'Delivered successfully',
    'failed': 'Delivery attempt failed'
  };
  return messages[status] || 'Status unknown';
};

module.exports = {
  calculateDeliveryDate,
  generateTrackingNumber,
  formatDeliveryDate,
  getDeliveryStatusMessage
};