const Activity = require('../models/Activity');

const logActivity = async (activityData) => {
  try {
    const activity = await Activity.create(activityData);
    console.log(`📊 Activity Logged: ${activity.type} - ${activity.description}`);
    return activity;
  } catch (error) {
    console.error('❌ Activity logging failed:', error.message);
  }
};

module.exports = { logActivity };