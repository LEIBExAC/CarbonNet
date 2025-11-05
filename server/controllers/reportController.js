const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const Papa = require("papaparse");
const Report = require("../models/report");
const Activity = require("../models/activity");
const { asyncHandler } = require("../middleware/errorHandler");

const REPORTS_DIR =
  process.env.REPORTS_PATH || path.join(__dirname, "..", "uploads", "reports");
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function buildAccessQuery(user, body) {
  const scope =
    body.scope ||
    (body.type === "individual"
      ? "individual"
      : body.institutionId
      ? "institution"
      : "individual");
  return {
    scope,
    institutionId: body.institutionId || user.institutionId,
    userId: user.id,
  };
}

async function fetchActivitiesForPeriod(
  { scope, userId, institutionId },
  startDate,
  endDate
) {
  const match = { activityDate: { $gte: startDate, $lte: endDate } };
  if (scope === "individual") {
    match.userId = userId;
  } else if (scope === "institution") {
    match.institutionId = institutionId;
  }
  return Activity.find(match).lean();
}

function aggregateReportData(activities, startDate, endDate) {
  const data = {
    totalEmissions: 0,
    emissionsByCategory: {},
    emissionsByScope: { scope1: 0, scope2: 0, scope3: 0 },
    trends: {},
    comparisons: {},
    recommendations: [],
    metadata: { startDate, endDate },
  };

  const stats = {
    totalActivities: activities.length,
    averageDailyEmissions: 0,
    peakEmissionDate: null,
    peakEmissionValue: 0,
    reductionFromBaseline: null,
    reductionPercentage: null,
  };

  const dailyTotals = {};

  activities.forEach((a) => {
    const ce = Number(a.carbonEmission) || 0;
    data.totalEmissions += ce;
    if (!data.emissionsByCategory[a.category])
      data.emissionsByCategory[a.category] = 0;
    data.emissionsByCategory[a.category] += ce;
    if (["transportation", "heating"].includes(a.category))
      data.emissionsByScope.scope1 += ce;
    else if (a.category === "electricity") data.emissionsByScope.scope2 += ce;
    else data.emissionsByScope.scope3 += ce;
    const ym = new Date(a.activityDate).toISOString().slice(0, 7);
    if (!data.trends[ym]) data.trends[ym] = 0;
    data.trends[ym] += ce;
    const d = new Date(a.activityDate).toISOString().slice(0, 10);
    if (!dailyTotals[d]) dailyTotals[d] = 0;
    dailyTotals[d] += ce;
  });

  const dayCount = Math.max(
    1,
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  );
  stats.averageDailyEmissions = Number(
    (data.totalEmissions / dayCount).toFixed(3)
  );
  Object.entries(dailyTotals).forEach(([date, total]) => {
    if (total > stats.peakEmissionValue) {
      stats.peakEmissionValue = Number(total.toFixed(3));
      stats.peakEmissionDate = new Date(date);
    }
  });

  if ((data.emissionsByCategory.transportation || 0) > 100) {
    data.recommendations.push(
      "Reduce transportation emissions: carpool, public transit, or biking."
    );
  }
  if ((data.emissionsByCategory.electricity || 0) > 50) {
    data.recommendations.push(
      "Lower electricity usage: efficient appliances and turning off idle devices."
    );
  }
  if ((data.emissionsByCategory.food || 0) > 30) {
    data.recommendations.push(
      "Consider plant-forward meals and reduce food waste."
    );
  }

  return { data, stats };
}

function writeFileForFormat(reportId, format, payload) {
  const base = path.join(REPORTS_DIR, `${reportId}`);
  let filePath, buffer;

  if (format === "json") {
    filePath = `${base}.json`;
    buffer = Buffer.from(JSON.stringify(payload, null, 2));
    fs.writeFileSync(filePath, buffer);
  } else if (format === "csv") {
    const rows = [
      { metric: "totalEmissions", value: payload.data.totalEmissions },
      ...Object.entries(payload.data.emissionsByCategory).map(([k, v]) => ({
        metric: `category_${k}`,
        value: v,
      })),
    ];
    const csv = Papa.unparse(rows);
    filePath = `${base}.csv`;
    fs.writeFileSync(filePath, csv);
  } else if (format === "excel" || format === "xlsx") {
    const wb = xlsx.utils.book_new();
    const summarySheet = xlsx.utils.json_to_sheet([
      {
        totalEmissions: payload.data.totalEmissions,
        totalActivities: payload.statistics.totalActivities,
        avgDaily: payload.statistics.averageDailyEmissions,
      },
    ]);
    xlsx.utils.book_append_sheet(wb, summarySheet, "summary");
    const catRows = Object.entries(payload.data.emissionsByCategory).map(
      ([category, emissions]) => ({ category, emissions })
    );
    xlsx.utils.book_append_sheet(
      wb,
      xlsx.utils.json_to_sheet(catRows),
      "by_category"
    );
    const trendRows = Object.entries(payload.data.trends).map(
      ([month, emissions]) => ({ month, emissions })
    );
    xlsx.utils.book_append_sheet(
      wb,
      xlsx.utils.json_to_sheet(trendRows),
      "trends"
    );
    filePath = `${base}.xlsx`;
    xlsx.writeFile(wb, filePath);
  } else {
    throw new Error("Unsupported format. Use json, csv, or excel (xlsx).");
  }

  const stat = fs.statSync(filePath);
  return { filePath, fileName: path.basename(filePath), fileSize: stat.size };
}

exports.generateReport = asyncHandler(async (req, res) => {
  const {
    type,
    format = "json",
    period,
    title,
    scope,
    institutionId,
    department,
  } = req.body;
  const startDate = new Date(period?.startDate);
  const endDate = new Date(period?.endDate);
  if (!type || !period?.startDate || !period?.endDate) {
    return res.status(400).json({
      success: false,
      message: "type and period.startDate/endDate are required",
    });
  }

  const {
    scope: resolvedScope,
    userId,
    institutionId: resolvedInstitutionId,
  } = buildAccessQuery(req.user, { type, scope, institutionId });

  const report = await Report.create({
    title: title || `${type} report (${format})`,
    type,
    format,
    period: { startDate, endDate },
    institutionId:
      resolvedScope === "institution" ? resolvedInstitutionId : undefined,
    userId: resolvedScope === "individual" ? userId : undefined,
    department: department || undefined,
    scope: resolvedScope,
    status: "processing",
    generatedBy: req.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  try {
    const activities = await fetchActivitiesForPeriod(
      { scope: resolvedScope, userId, institutionId: resolvedInstitutionId },
      startDate,
      endDate
    );
    const { data, stats } = aggregateReportData(activities, startDate, endDate);

    const payload = { data, statistics: { ...stats } };
    const { filePath, fileName, fileSize } = writeFileForFormat(
      report._id.toString(),
      format.toLowerCase(),
      payload
    );

    report.data = data;
    report.statistics = stats;
    report.fileUrl = path
      .relative(path.join(__dirname, ".."), filePath)
      .replace(/\\/g, "/");
    report.fileName = fileName;
    report.fileSize = fileSize;
    report.status = "completed";
    await report.save();

    res
      .status(201)
      .json({ success: true, message: "Report generated", data: { report } });
  } catch (err) {
    report.status = "failed";
    await report.save();
    return res.status(500).json({ success: false, message: err.message });
  }
});

exports.getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const query = isAdmin ? {} : { generatedBy: req.user.id };
  const docs = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const count = await Report.countDocuments(query);
  res.status(200).json({
    success: true,
    data: {
      reports: docs,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalReports: count,
    },
  });
});

exports.getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report)
    return res
      .status(404)
      .json({ success: false, message: "Report not found" });
  const isOwner = report.generatedBy?.toString() === req.user.id.toString();
  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  if (!isOwner && !isAdmin)
    return res.status(403).json({ success: false, message: "Not authorized" });
  res.status(200).json({ success: true, data: { report } });
});

exports.downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report)
    return res
      .status(404)
      .json({ success: false, message: "Report not found" });
  const isOwner = report.generatedBy?.toString() === req.user.id.toString();
  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  if (!isOwner && !isAdmin)
    return res.status(403).json({ success: false, message: "Not authorized" });
  if (!report.fileUrl)
    return res
      .status(400)
      .json({ success: false, message: "Report has no file" });

  const absPath = path.join(__dirname, "..", report.fileUrl);
  if (!fs.existsSync(absPath))
    return res.status(404).json({ success: false, message: "File not found" });

  await report.incrementDownload();
  res.download(absPath, report.fileName);
});

exports.deleteReport = asyncHandler(async (req, res) => {
  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  if (!isAdmin)
    return res.status(403).json({ success: false, message: "Not authorized" });

  const report = await Report.findById(req.params.id);
  if (!report)
    return res
      .status(404)
      .json({ success: false, message: "Report not found" });

  if (report.fileUrl) {
    const absPath = path.join(__dirname, "..", report.fileUrl);
    if (fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
      } catch (_) {}
    }
  }

  await report.deleteOne();
  res.status(200).json({ success: true, message: "Report deleted" });
});
