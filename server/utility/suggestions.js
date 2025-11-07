// Generate reduction suggestions based on user activity distribution
module.exports = function generateSuggestions(byCategory = {}) {
  const tips = [];
  const t =
    byCategory.transportation?.emissions || byCategory.transportation || 0;
  const e = byCategory.electricity?.emissions || byCategory.electricity || 0;
  const f = byCategory.food?.emissions || byCategory.food || 0;
  const w = byCategory.waste?.emissions || byCategory.waste || 0;

  if (t > 0) {
    tips.push(
      "Use public transit, carpool, or bike for short trips to reduce transportation emissions.",
      "Maintain proper tire pressure and avoid aggressive driving to improve fuel efficiency.",
      "Consider EVs or hybrids where possible; bundle errands to cut total distance."
    );
  }
  if (e > 0) {
    tips.push(
      "Switch to LED lighting and ENERGY STAR appliances to reduce electricity usage.",
      "Unplug idle devices and use smart power strips to minimize standby power.",
      "Enable sleep modes on computers and set thermostats efficiently."
    );
  }
  if (f > 0) {
    tips.push(
      "Choose plant-forward meals more often; reduce red meat consumption.",
      "Plan meals and store food properly to cut food waste.",
      "Buy seasonal and local produce when possible."
    );
  }
  if (w > 0) {
    tips.push(
      "Recycle properly, avoid single-use plastics, and compost organic waste.",
      "Prefer products with minimal packaging or refill options."
    );
  }

  if (tips.length === 0) {
    tips.push(
      "Great start! Log more activities to receive tailored suggestions."
    );
  }

  return tips;
};
