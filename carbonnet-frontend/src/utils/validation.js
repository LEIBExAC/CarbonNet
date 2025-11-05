/**
 * Validation helper functions
 */

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8;
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
};

export const isValidNumber = (value) => {
  return !isNaN(value) && value !== '' && value !== null;
};

export const validateActivity = (activity) => {
  const errors = {};

  if (!activity.category) {
    errors.category = 'Category is required';
  }

  if (!activity.date) {
    errors.date = 'Date is required';
  }

  if (activity.category === 'transportation') {
    if (!activity.transportMode) {
      errors.transportMode = 'Transport mode is required';
    }
    if (!isValidNumber(activity.distance) || activity.distance <= 0) {
      errors.distance = 'Valid distance is required';
    }
  }

  if (activity.category === 'electricity') {
    if (!isValidNumber(activity.energyConsumed) || activity.energyConsumed <= 0) {
      errors.energyConsumed = 'Valid energy amount is required';
    }
  }

  if (activity.category === 'food') {
    if (!activity.dietType) {
      errors.dietType = 'Diet type is required';
    }
    if (!isValidNumber(activity.meals) || activity.meals <= 0) {
      errors.meals = 'Valid number of meals is required';
    }
  }

  if (activity.category === 'waste') {
    if (!activity.wasteType) {
      errors.wasteType = 'Waste type is required';
    }
    if (!isValidNumber(activity.quantity) || activity.quantity <= 0) {
      errors.quantity = 'Valid quantity is required';
    }
  }

  if (activity.category === 'water') {
    if (!isValidNumber(activity.waterUsed) || activity.waterUsed <= 0) {
      errors.waterUsed = 'Valid water usage is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProfile = (profile) => {
  const errors = {};

  if (!profile.name || profile.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!profile.email || !isValidEmail(profile.email)) {
    errors.email = 'Valid email is required';
  }

  if (profile.phone && !isValidPhone(profile.phone)) {
    errors.phone = 'Invalid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePasswordChange = (data) => {
  const errors = {};

  if (!data.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }

  if (!data.newPassword || !isValidPassword(data.newPassword)) {
    errors.newPassword = 'Password must be at least 8 characters';
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateChallenge = (challenge) => {
  const errors = {};

  if (!challenge.title || challenge.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!challenge.description || challenge.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!challenge.type) {
    errors.type = 'Challenge type is required';
  }

  if (!challenge.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!challenge.endDate) {
    errors.endDate = 'End date is required';
  }

  if (challenge.startDate && challenge.endDate && new Date(challenge.startDate) >= new Date(challenge.endDate)) {
    errors.endDate = 'End date must be after start date';
  }

  if (!isValidNumber(challenge.targetValue) || challenge.targetValue <= 0) {
    errors.targetValue = 'Valid target value is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateReport = (report) => {
  const errors = {};

  if (!report.type) {
    errors.type = 'Report type is required';
  }

  if (!report.format) {
    errors.format = 'Report format is required';
  }

  if (!report.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!report.endDate) {
    errors.endDate = 'End date is required';
  }

  if (report.startDate && report.endDate && new Date(report.startDate) >= new Date(report.endDate)) {
    errors.endDate = 'End date must be after start date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
