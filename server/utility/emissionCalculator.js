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
        factorUsed = {
          factor:
            DEFAULT_FACTORS.transportation[
              `${activityData.transportation.mode}_${activityData.transportation.fuelType}`
            ] || 0.1,
          source: "DEFRA",
          version: "2023",
        };
        break;

      case "electricity":
        totalEmissions = await calculateElectricityEmissions(
          activityData,
          institutionId
        );
        factorUsed = {
          factor:
            DEFAULT_FACTORS.electricity[activityData.electricity.source] ||
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
        factorUsed = {
          factor: DEFAULT_FACTORS.food[activityData.food.dietType] || 2.0,
          source: "CUSTOM",
          version: "2023",
        };
        break;

      case "waste":
        totalEmissions = await calculateWasteEmissions(
          activityData,
          institutionId
        );
        factorUsed = {
          factor: DEFAULT_FACTORS.waste[activityData.waste.type] || 0.45,
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
        totalEmissions = activityData.quantity * 0.5; // Generic
        factorUsed = {
          factor: 0.5,
          source: "ESTIMATED",
          version: "2023",
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
  const { mode, distance, fuelType, passengers } = activityData.transportation;

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

  let emissions = distance * (emissionFactor || 0.1);

  if (passengers && passengers > 1) {
    emissions = emissions / passengers;
  }

  return emissions;
}

async function calculateElectricityEmissions(activityData, institutionId) {
  const { consumption, source } = activityData.electricity;

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

  return consumption * emissionFactor;
}

async function calculateFoodEmissions(activityData, institutionId) {
  const { dietType, quantity, foodWaste } = activityData.food;

  let emissionFactor = DEFAULT_FACTORS.food[dietType] || 2.0;

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

  let emissions = emissionFactor * (quantity || 1);

  if (foodWaste && foodWaste > 0) {
    emissions += foodWaste * DEFAULT_FACTORS.waste.food;
  }

  return emissions;
}

async function calculateWasteEmissions(activityData, institutionId) {
  const { type, quantity, recycled } = activityData.waste;

  if (!quantity || quantity <= 0) return 0;

  let emissionFactor =
    DEFAULT_FACTORS.waste[type] || DEFAULT_FACTORS.waste.general;

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

  let emissions = quantity * emissionFactor;

  if (recycled) {
    emissions = emissions * 0.3;
  }

  return emissions;
}

async function calculateWaterEmissions(activityData, institutionId) {
  const { consumption } = activityData.water;

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

  return consumption * emissionFactor;
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
