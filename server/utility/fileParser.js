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
      const activity = {
        category: category || row.category || "other",
        activityDate: row.date || row.activity_date || new Date(),
        description: row.description || row.details || "",
      };

      if (activity.category === "transportation") {
        activity.transportation = {
          mode: row.mode || row.transport_mode,
          distance: parseFloat(row.distance) || 0,
          fuelType: row.fuel_type || row.fuel,
          passengers: parseInt(row.passengers) || 1,
        };
      }

      if (activity.category === "electricity") {
        activity.electricity = {
          consumption: parseFloat(row.consumption || row.kwh || row.units) || 0,
          source: row.source || row.energy_source || "grid",
          appliance: row.appliance || row.device,
        };
      }

      if (activity.category === "food") {
        activity.food = {
          mealType: row.meal_type || row.meal,
          dietType: row.diet_type || row.diet || "veg",
          quantity: parseInt(row.quantity) || 1,
          foodWaste: parseFloat(row.food_waste || row.waste) || 0,
        };
      }

      if (activity.category === "waste") {
        activity.waste = {
          type: row.waste_type || row.type,
          quantity: parseFloat(row.quantity || row.weight) || 0,
          recycled: row.recycled === "yes" || row.recycled === true || false,
        };
      }

      if (activity.category === "water") {
        activity.water = {
          consumption: parseFloat(row.consumption || row.liters) || 0,
          usage: row.usage || row.purpose,
        };
      }

      // Generic
      if (
        !activity.transportation &&
        !activity.electricity &&
        !activity.food &&
        !activity.waste &&
        !activity.water
      ) {
        activity.quantity = parseFloat(row.quantity || row.amount) || 0;
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
