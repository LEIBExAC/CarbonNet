/**
 * This Module is not implimented yet. Do NOT use it.
 *
 * fileParser.js
 * Utility functions to parse CSV, Excel, and PDF files,
 * map data to activity format, and validate the data.
 */
const xlsx = require("xlsx");
const Papa = require("papaparse");
const pdfParse = require("pdf-parse");
const fs = require("fs");

exports.parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) =>
          header.trim().toLowerCase().replace(/\s+/g, "_"),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    } catch (error) {
      reject(new Error(`Failed to read CSV file: ${error.message}`));
    }
  });
};

exports.parseExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const data = xlsx.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: null,
        blankrows: false,
      });

      const transformedData = data.map((row) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
          const newKey = key.trim().toLowerCase().replace(/\s+/g, "_");
          newRow[newKey] = row[key];
        });
        return newRow;
      });

      resolve(transformedData);
    } catch (error) {
      reject(new Error(`Excel parsing error: ${error.message}`));
    }
  });
};

exports.parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    throw new Error(`PDF parsing error: ${error.message}`);
  }
};

exports.mapToActivityFormat = (data, category) => {
  const activities = [];

  data.forEach((row, index) => {
    try {
      const toNumber = (val, def = 0) => {
        if (typeof val === "number" && Number.isFinite(val)) return val;
        if (typeof val === "string") {
          const n = parseFloat(val.replace(/,/g, ""));
          return Number.isFinite(n) ? n : def;
        }
        return def;
      };

      const parseDate = (val) => {
        if (!val) return new Date();
        if (val instanceof Date && !isNaN(val.getTime())) return val;
        if (typeof val === "number") {
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date() : d;
        }
        if (typeof val === "string") {
          // Try ISO first
          let d = new Date(val);
          if (!isNaN(d.getTime())) return d;
          // Try DD/MM/YYYY
          const m1 = val.match(/^([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](\d{2,4})$/);
          if (m1) {
            const dd = parseInt(m1[1], 10);
            const mm = parseInt(m1[2], 10) - 1;
            const yy = parseInt(m1[3].length === 2 ? "20" + m1[3] : m1[3], 10);
            d = new Date(yy, mm, dd);
            if (!isNaN(d.getTime())) return d;
          }
          // Try MM/DD/YYYY
          const m2 = val.match(/^([0-1]?\d)[\/\-]([0-3]?\d)[\/\-](\d{2,4})$/);
          if (m2) {
            const mm = parseInt(m2[1], 10) - 1;
            const dd = parseInt(m2[2], 10);
            const yy = parseInt(m2[3].length === 2 ? "20" + m2[3] : m2[3], 10);
            d = new Date(yy, mm, dd);
            if (!isNaN(d.getTime())) return d;
          }
        }
        return new Date();
      };
      // Resolve category: if incoming category is 'all' or 'auto', prefer row.category
      const inputCategory =
        typeof category === "string" && category
          ? category.trim().toLowerCase()
          : null;
      const rowCategory =
        typeof row.category === "string" && row.category
          ? row.category.trim().toLowerCase()
          : null;
      const resolvedCategory =
        !inputCategory || inputCategory === "all" || inputCategory === "auto"
          ? rowCategory || "other"
          : inputCategory;

      const activity = {
        category: resolvedCategory,
        activityDate: parseDate(
          row.date || row.activity_date || row.activityDate
        ),
        description: row.description || row.details || "",
      };

      if (activity.category === "transportation") {
        const distance = toNumber(row.distance, 0);
        const passengers = Math.max(1, toNumber(row.passengers, 1));
        activity.transportation = {
          mode: (row.mode || row.transport_mode || "car")
            .toString()
            .toLowerCase(),
          distance: distance > 0 ? distance : 0,
          fuelType: (row.fuel_type || row.fuel || "petrol")
            .toString()
            .toLowerCase(),
          passengers,
        };
      }

      if (activity.category === "electricity") {
        const consumption = toNumber(
          row.consumption ?? row.kwh ?? row.units,
          0
        );
        activity.electricity = {
          consumption: consumption > 0 ? consumption : 0,
          source: (row.source || row.energy_source || "grid")
            .toString()
            .toLowerCase(),
          appliance: row.appliance || row.device,
        };
      }

      if (activity.category === "food") {
        const quantity = toNumber(row.quantity, 1);
        const foodWaste = toNumber(row.food_waste ?? row.waste, 0);
        activity.food = {
          mealType: (row.meal_type || row.meal || "lunch")
            .toString()
            .toLowerCase(),
          dietType: (row.diet_type || row.diet || "veg")
            .toString()
            .toLowerCase(),
          quantity: quantity > 0 ? quantity : 1,
          foodWaste: foodWaste >= 0 ? foodWaste : 0,
        };
      }

      if (activity.category === "waste") {
        const quantity = toNumber(row.quantity ?? row.weight, 0);
        activity.waste = {
          type: (row.waste_type || row.type || "general")
            .toString()
            .toLowerCase(),
          quantity: quantity > 0 ? quantity : 0,
          recycled:
            (row.recycled + "").toLowerCase() === "yes" ||
            row.recycled === true,
        };
      }

      if (activity.category === "water") {
        const consumption = toNumber(row.consumption ?? row.liters, 0);
        activity.water = {
          consumption: consumption > 0 ? consumption : 0,
          usage: (row.usage || row.purpose || "drinking")
            .toString()
            .toLowerCase(),
        };
      }

      // Generic - for "other" category or when no specific category matches
      if (
        !activity.transportation &&
        !activity.electricity &&
        !activity.food &&
        !activity.waste &&
        !activity.water
      ) {
        const quantity = toNumber(row.quantity ?? row.amount, 1);
        activity.quantity = quantity > 0 ? quantity : 1;
        activity.unit = row.unit || "kg";
      }

      activities.push(activity);
    } catch (error) {
      console.error(`Error mapping row ${index}:`, error.message);
    }
  });

  return activities;
};

exports.validateActivityData = (activities) => {
  const errors = [];
  const validActivities = [];

  activities.forEach((activity, index) => {
    const rowErrors = [];

    const validCategories = [
      "transportation",
      "electricity",
      "food",
      "waste",
      "water",
      "heating",
      "cooling",
      "paper",
      "events",
      "other",
    ];
    if (!validCategories.includes(activity.category)) {
      // If category came in as something like 'all' we already mapped it; keep error for visibility
      rowErrors.push(`Invalid category: ${activity.category}`);
    }

    if (activity.category === "transportation") {
      if (
        !activity.transportation ||
        !activity.transportation.distance ||
        activity.transportation.distance <= 0
      ) {
        rowErrors.push("Transportation requires positive distance");
      }
    }

    if (activity.category === "electricity") {
      if (
        !activity.electricity ||
        !activity.electricity.consumption ||
        activity.electricity.consumption <= 0
      ) {
        rowErrors.push("Electricity requires positive consumption");
      }
    }

    if (activity.category === "waste") {
      if (
        !activity.waste ||
        !activity.waste.quantity ||
        activity.waste.quantity <= 0
      ) {
        rowErrors.push("Waste requires positive quantity");
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: index + 1,
        errors: rowErrors,
        data: activity,
      });
    } else {
      validActivities.push(activity);
    }
  });

  return {
    valid: validActivities,
    errors: errors,
    validCount: validActivities.length,
    errorCount: errors.length,
  };
};

exports.parseFile = async (filePath, fileType) => {
  const extension = fileType || filePath.split(".").pop().toLowerCase();

  switch (extension) {
    case "csv":
      return await this.parseCSV(filePath);
    case "xlsx":
    case "xls":
      return await this.parseExcel(filePath);
    case "pdf":
      return await this.parsePDF(filePath);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};
