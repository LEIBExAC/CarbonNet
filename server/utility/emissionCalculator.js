const EmissionFactor = require("../models/emissionFactor");

// Default emission factors
const DEFAULT_FACTORS = {
  transportation: {
    car_petrol: 0.171, // kg CO2e per km
    car_diesel: 0.156,
    car_cng: 0.142,
    car_electric: 0.053,
    bike: 0.114,
    bus: 0.089,
    train: 0.041,
    metro: 0.028,
    rickshaw: 0.065,
    flight_domestic: 0.255,
    flight_international: 0.195,
  },
  electricity: {
    grid: 0.82,
    solar: 0.048,
    wind: 0.011,
  },
  food: {
    veg: 2.0,
    non_veg: 5.5,
    vegan: 1.5,
  },
  waste: {
    general: 0.45,
    plastic: 6.0,
    paper: 0.9,
    food: 0.3,
    electronic: 2.5,
  },
  water: {
    consumption: 0.0003,
  },
};

exports.calculateEmissions = async (activityData) => {
  const { category, institutionId } = activityData;
  let totalEmissions = 0;
  let factorUsed = {};

  try {
    switch (category) {
      case "transportation":
        totalEmissions = await calculateTransportationEmissions(
          activityData,
          institutionId
        );
        // Defensive read of nested transportation data
        const tMode = activityData.transportation?.mode;
        const tFuel = activityData.transportation?.fuelType;
        factorUsed = {
          factor:
            (tMode &&
              tFuel &&
              DEFAULT_FACTORS.transportation[`${tMode}_${tFuel}`]) ||
            0.1,
          source: "DEFRA",
          version: "2023",
        };
        break;

      case "electricity":
        totalEmissions = await calculateElectricityEmissions(
          activityData,
          institutionId
        );
        const eSource = activityData.electricity?.source;
        factorUsed = {
          factor:
            (eSource && DEFAULT_FACTORS.electricity[eSource]) ||
            DEFAULT_FACTORS.electricity.grid,
          source: "IPCC",
          version: "2023",
        };
        break;

      case "food":
        totalEmissions = await calculateFoodEmissions(
          activityData,
          institutionId
        );
        const fDiet = activityData.food?.dietType;
        factorUsed = {
          factor: (fDiet && DEFAULT_FACTORS.food[fDiet]) || 2.0,
          source: "CUSTOM",
          version: "2023",
        };
        break;

      case "waste":
        totalEmissions = await calculateWasteEmissions(
          activityData,
          institutionId
        );
        const wType = activityData.waste?.type;
        factorUsed = {
          factor: (wType && DEFAULT_FACTORS.waste[wType]) || 0.45,
          source: "EPA",
          version: "2023",
        };
        break;

      case "water":
        totalEmissions = await calculateWaterEmissions(
          activityData,
          institutionId
        );
        factorUsed = {
          factor: DEFAULT_FACTORS.water.consumption,
          source: "CUSTOM",
          version: "2023",
        };
        break;

      default:
        try {
          const { isEnabled, estimateEmissions } = require("./aiEstimator");
          console.log(
            "[EmissionCalculator] AI Estimator enabled:",
            isEnabled()
          );
          if (isEnabled()) {
            console.log("[EmissionCalculator] Calling AI estimator with:", {
              category: activityData.category,
              subcategory: activityData.subcategory,
              description: activityData.description,
              quantity: activityData.quantity,
              unit: activityData.unit,
            });
            const ai = await estimateEmissions(activityData);
            console.log("[EmissionCalculator] AI estimate result:", ai);
            if (ai && typeof ai.total === "number") {
              totalEmissions = ai.total;
              factorUsed = ai.factorUsed || {
                source: "AI_ESTIMATE",
                version: new Date().getFullYear().toString(),
              };
              break;
            }
          } else {
            console.log(
              "[EmissionCalculator] AI estimator is disabled - API key not configured"
            );
          }
        } catch (err) {
          console.error(
            "AI estimator failed for generic emissions:",
            err.message
          );
          console.error("Full error:", err);
        }
        console.log(
          "[EmissionCalculator] Using fallback factor for other category"
        );
        totalEmissions = (activityData.quantity || 0) * 0.5; // Fallback generic factor
        factorUsed = {
          factor: 0.5,
          source: "ESTIMATED",
          version: new Date().getFullYear().toString(),
        };
    }

    return {
      total: parseFloat(totalEmissions.toFixed(3)),
      factorUsed,
    };
  } catch (error) {
    console.error("Emission calculation error:", error);
    return {
      total: 0,
      factorUsed: {
        factor: 0,
        source: "ERROR",
        version: "2023",
      },
    };
  }
};

async function calculateTransportationEmissions(activityData, institutionId) {
  const { mode, distance, fuelType, passengers } =
    activityData.transportation || {};

  if (!activityData.transportation) return 0; // Missing nested object

  if (!distance || distance <= 0) return 0;

  const factorKey = `${mode}_${fuelType}`;
  let emissionFactor = DEFAULT_FACTORS.transportation[factorKey];

  try {
    const dbFactor = await EmissionFactor.getFactorForInstitution(
      "transportation",
      factorKey,
      institutionId
    );
    if (dbFactor) {
      emissionFactor = dbFactor.factor;
    }
  } catch (error) {
    console.log("Using default emission factor for transportation");
  }

  if (!emissionFactor) {
    try {
      const { isEnabled, estimateEmissions } = require("./aiEstimator");
      if (isEnabled()) {
        const ai = await estimateEmissions(activityData);
        if (ai && typeof ai.total === "number") {
          return ai.total;
        }
      }
    } catch (err) {
      console.log("AI estimator failed for transportation emissions", err);
    }
  }

  let emissions = distance * (emissionFactor || 0.1);

  if (passengers && passengers > 1) {
    emissions = emissions / passengers;
  }

  return emissions;
}

async function calculateElectricityEmissions(activityData, institutionId) {
  const { consumption, source } = activityData.electricity || {};

  if (!activityData.electricity) return 0;

  if (!consumption || consumption <= 0) return 0;

  let emissionFactor =
    DEFAULT_FACTORS.electricity[source] || DEFAULT_FACTORS.electricity.grid;

  try {
    const dbFactor = await EmissionFactor.getFactorForInstitution(
      "electricity",
      source,
      institutionId
    );
    if (dbFactor) {
      emissionFactor = dbFactor.factor;
    }
  } catch (error) {
    console.log("Using default emission factor for electricity");
  }

  if (!emissionFactor) {
    try {
      const { isEnabled, estimateEmissions } = require("./aiEstimator");
      if (isEnabled()) {
        const ai = await estimateEmissions(activityData);
        if (ai && typeof ai.total === "number") {
          return ai.total;
        }
      }
    } catch (err) {
      console.log("AI estimator failed for electricity emissions", err);
    }
  }

  return consumption * (emissionFactor || 0.82);
}

async function calculateFoodEmissions(activityData, institutionId) {
  const { dietType, quantity, foodWaste } = activityData.food || {};

  if (!activityData.food) return 0;

  let emissionFactor = DEFAULT_FACTORS.food[dietType] || null;

  try {
    const dbFactor = await EmissionFactor.getFactorForInstitution(
      "food",
      dietType,
      institutionId
    );
    if (dbFactor) {
      emissionFactor = dbFactor.factor;
    }
  } catch (error) {
    console.log("Using default emission factor for food");
  }

  if (!emissionFactor) {
    try {
      const { isEnabled, estimateEmissions } = require("./aiEstimator");
      if (isEnabled()) {
        const ai = await estimateEmissions(activityData);
        if (ai && typeof ai.total === "number") {
          return ai.total;
        }
      }
    } catch (err) {
      console.log("AI estimator failed for food emissions", err);
    }
  }

  let emissions = (emissionFactor || 2.0) * (quantity || 1);

  if (foodWaste && foodWaste > 0) {
    emissions += foodWaste * DEFAULT_FACTORS.waste.food;
  }

  return emissions;
}

async function calculateWasteEmissions(activityData, institutionId) {
  const { type, quantity, recycled } = activityData.waste || {};

  if (!activityData.waste) return 0;

  if (!quantity || quantity <= 0) return 0;

  let emissionFactor = DEFAULT_FACTORS.waste[type] || null;

  try {
    const dbFactor = await EmissionFactor.getFactorForInstitution(
      "waste",
      type,
      institutionId
    );
    if (dbFactor) {
      emissionFactor = dbFactor.factor;
    }
  } catch (error) {
    console.log("Using default emission factor for waste");
  }

  if (!emissionFactor) {
    try {
      const { isEnabled, estimateEmissions } = require("./aiEstimator");
      if (isEnabled()) {
        const ai = await estimateEmissions(activityData);
        if (ai && typeof ai.total === "number") {
          return ai.total;
        }
      }
    } catch (err) {
      console.log("AI estimator failed for waste emissions", err);
    }
  }

  let emissions = quantity * (emissionFactor || DEFAULT_FACTORS.waste.general);

  if (recycled) {
    emissions = emissions * 0.3;
  }

  return emissions;
}

async function calculateWaterEmissions(activityData, institutionId) {
  const { consumption } = activityData.water || {};

  if (!activityData.water) return 0;

  if (!consumption || consumption <= 0) return 0;

  let emissionFactor = DEFAULT_FACTORS.water.consumption;

  try {
    const dbFactor = await EmissionFactor.getFactorForInstitution(
      "water",
      "consumption",
      institutionId
    );
    if (dbFactor) {
      emissionFactor = dbFactor.factor;
    }
  } catch (error) {
    console.log("Using default emission factor for water");
  }

  if (!emissionFactor) {
    try {
      const { isEnabled, estimateEmissions } = require("./aiEstimator");
      if (isEnabled()) {
        const ai = await estimateEmissions(activityData);
        if (ai && typeof ai.total === "number") {
          return ai.total;
        }
      }
    } catch (err) {
      console.log("AI estimator failed for water emissions", err);
    }
  }

  return consumption * (emissionFactor || DEFAULT_FACTORS.water.consumption);
}

exports.calculateInstitutionalEmissions = async (
  institutionId,
  startDate,
  endDate
) => {
  const Activity = require("../models/activity");

  const activities = await Activity.find({
    institutionId,
    activityDate: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  const summary = {
    totalEmissions: 0,
    byScope: { scope1: 0, scope2: 0, scope3: 0 },
    byCategory: {},
    activityCount: activities.length,
  };

  activities.forEach((activity) => {
    summary.totalEmissions += activity.carbonEmission;

    if (["transportation", "heating"].includes(activity.category)) {
      summary.byScope.scope1 += activity.carbonEmission;
    } else if (activity.category === "electricity") {
      summary.byScope.scope2 += activity.carbonEmission;
    } else {
      summary.byScope.scope3 += activity.carbonEmission;
    }

    if (!summary.byCategory[activity.category]) {
      summary.byCategory[activity.category] = 0;
    }
    summary.byCategory[activity.category] += activity.carbonEmission;
  });

  return summary;
};

exports.estimatePerCapitaEmissions = (totalEmissions, population) => {
  if (!population || population <= 0) return 0;
  return parseFloat((totalEmissions / population).toFixed(3));
};

exports.calculateReductionPercentage = (baseline, current) => {
  if (!baseline || baseline <= 0) return 0;
  const reduction = ((baseline - current) / baseline) * 100;
  return parseFloat(reduction.toFixed(2));
};
