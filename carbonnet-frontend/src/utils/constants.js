export const ACTIVITY_CATEGORIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'food', label: 'Food' },
  { value: 'waste', label: 'Waste' },
  { value: 'water', label: 'Water' },
];

export const TRANSPORTATION_MODES = [
  { value: 'car', label: 'Car' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'flight', label: 'Flight' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'walking', label: 'Walking' },
];

export const ELECTRICITY_SOURCES = [
  { value: 'grid', label: 'Grid' },
  { value: 'solar', label: 'Solar' },
  { value: 'wind', label: 'Wind' },
  { value: 'hydro', label: 'Hydro' },
  { value: 'coal', label: 'Coal' },
  { value: 'natural_gas', label: 'Natural Gas' },
];

export const DIET_TYPES = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
];

export const WASTE_TYPES = [
  { value: 'general', label: 'General Waste' },
  { value: 'recyclable', label: 'Recyclable' },
  { value: 'compost', label: 'Compost' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'hazardous', label: 'Hazardous' },
];

export const WATER_USAGE_TYPES = [
  { value: 'domestic', label: 'Domestic' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'industrial', label: 'Industrial' },
];

export const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
];

export const REPORT_TYPES = [
  { value: 'summary', label: 'Summary Report' },
  { value: 'detailed', label: 'Detailed Report' },
  { value: 'trend', label: 'Trend Analysis' },
  { value: 'comparison', label: 'Comparison Report' },
];

export const TIME_PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export const USER_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
];

export const CHALLENGE_TYPES = [
  { value: 'reduction', label: 'Reduction Challenge' },
  { value: 'activity', label: 'Activity Challenge' },
  { value: 'streak', label: 'Streak Challenge' },
  { value: 'competition', label: 'Competition' },
];

export const CHALLENGE_DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const EMISSION_SCOPES = [
  { value: 1, label: 'Scope 1 - Direct Emissions' },
  { value: 2, label: 'Scope 2 - Indirect Emissions (Energy)' },
  { value: 3, label: 'Scope 3 - Indirect Emissions (Other)' },
];

export const CHART_COLORS = {
  primary: '#10b981', // emerald-500
  secondary: '#3b82f6', // blue-500
  tertiary: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  success: '#22c55e', // green-500
  warning: '#eab308', // yellow-500
  info: '#06b6d4', // cyan-500
  purple: '#a855f7', // purple-500
};

export const PAGINATION_LIMITS = [10, 25, 50, 100];

export const DEFAULT_PAGE_SIZE = 10;
