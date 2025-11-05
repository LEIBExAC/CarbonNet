import React from "react";
import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { Card, StatCard } from "../../components/ui";
import {
  EmissionsTrendChart,
  EmissionsBarChart,
} from "../../components/charts";
import api from "../../api/client";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  Loader2,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

export default function Analytics() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRange, setDateRange] = useState("6months");

  useEffect(() => {
    setDateFilters();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (dateRange !== "custom") {
      setDateFilters();
      loadAnalytics();
    }
  }, [dateRange]);

  const setDateFilters = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case "week":
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        start.setMonth(end.getMonth() - 1);
        break;
      case "3months":
        start.setMonth(end.getMonth() - 3);
        break;
      case "6months":
        start.setMonth(end.getMonth() - 6);
        break;
      case "year":
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 6);
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.admin.getAnalytics(params);
      setAnalytics(response.data);
    } catch (error) {
      addToast(
        error.message || "Failed to load analytics",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  const handleApplyCustomDates = () => {
    if (!startDate || !endDate) {
      addToast("Please select both start and end dates", "error");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      addToast("Start date must be before end date", "error");
      return;
    }
    loadAnalytics();
  };

  // Format monthly trend data for chart
  const formatMonthlyTrendData = () => {
    if (!analytics?.monthlyTrend) return [];

    return analytics.monthlyTrend.map((item) => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[item._id.month - 1];
      return {
        date: `${monthName} ${item._id.year}`,
        emissions: parseFloat((item.totalEmissions / 1000).toFixed(2)), // Convert to tons
        activities: item.activityCount,
      };
    });
  };

  // Format category breakdown data for chart
  const formatCategoryData = () => {
    if (!analytics?.categoryBreakdown) return [];

    return analytics.categoryBreakdown.map((item) => ({
      name:
        item._id.charAt(0).toUpperCase() + item._id.slice(1).replace(/_/g, " "),
      emissions: parseFloat((item.totalEmissions / 1000).toFixed(2)), // Convert to tons
      activities: item.activityCount,
      value: parseFloat((item.totalEmissions / 1000).toFixed(2)),
    }));
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!analytics) return null;

    const monthlyData = analytics.monthlyTrend || [];
    const categoryData = analytics.categoryBreakdown || [];

    const totalEmissions = monthlyData.reduce(
      (sum, item) => sum + (item.totalEmissions || 0),
      0
    );
    const totalActivities = monthlyData.reduce(
      (sum, item) => sum + (item.activityCount || 0),
      0
    );
    const avgEmissionsPerActivity =
      totalActivities > 0 ? totalEmissions / totalActivities : 0;
    const topCategory = categoryData[0];

    return {
      totalEmissions: parseFloat((totalEmissions / 1000).toFixed(2)),
      totalActivities,
      avgEmissionsPerActivity: parseFloat(
        (avgEmissionsPerActivity / 1000).toFixed(2)
      ),
      topCategory: topCategory
        ? {
            name:
              topCategory._id.charAt(0).toUpperCase() +
              topCategory._id.slice(1).replace(/_/g, " "),
            emissions: parseFloat(
              (topCategory.totalEmissions / 1000).toFixed(2)
            ),
          }
        : null,
    };
  };

  const summary = calculateSummary();

  if (loading && !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-emerald-600" size={48} />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into carbon emissions and activities
          </p>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleApplyCustomDates}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Filter size={18} />
                Apply
              </button>
            </>
          )}

          {analytics?.period && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              <span>
                {format(new Date(analytics.period.start), "MMM dd, yyyy")} -{" "}
                {format(new Date(analytics.period.end), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            title="Total Emissions"
            value={`${summary.totalEmissions.toLocaleString()} tCO₂e`}
            icon={TrendingUp}
            color="red"
          />
          <StatCard
            title="Total Activities"
            value={summary.totalActivities.toLocaleString()}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Avg per Activity"
            value={`${summary.avgEmissionsPerActivity.toFixed(2)} tCO₂e`}
            icon={BarChart3}
            color="purple"
          />
          {summary.topCategory && (
            <Card hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Top Category</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.topCategory.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {summary.topCategory.emissions.toFixed(2)} tCO₂e
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <EmissionsTrendChart
          title="Monthly Emissions Trend"
          data={formatMonthlyTrendData()}
          dataKeys={["emissions"]}
          colors={["#10b981"]}
        />

        {/* Monthly Activities Trend */}
        <EmissionsTrendChart
          title="Monthly Activities Trend"
          data={formatMonthlyTrendData()}
          dataKeys={["activities"]}
          colors={["#3b82f6"]}
        />
      </div>

      {/* Category Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Emissions Bar Chart */}
        <EmissionsBarChart
          title="Emissions by Category"
          data={formatCategoryData()}
          dataKey="emissions"
          nameKey="name"
        />

        {/* Category Activities Bar Chart */}
        <EmissionsBarChart
          title="Activities by Category"
          data={formatCategoryData()}
          dataKey="activities"
          nameKey="name"
        />
      </div>

      {/* Category Breakdown Table */}
      {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Detailed Category Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Total Emissions (kgCO₂e)
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Total Emissions (tCO₂e)
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Activity Count
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Avg per Activity (kgCO₂e)
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.categoryBreakdown.map((item, index) => {
                  const categoryName =
                    item._id.charAt(0).toUpperCase() +
                    item._id.slice(1).replace(/_/g, " ");
                  const avgPerActivity =
                    item.activityCount > 0
                      ? item.totalEmissions / item.activityCount
                      : 0;
                  return (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{categoryName}</td>
                      <td className="py-3 px-4 text-right">
                        {item.totalEmissions.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {(item.totalEmissions / 1000).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.activityCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {avgPerActivity.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Monthly Trends Table */}
      {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Monthly Trends Detail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Total Emissions (kgCO₂e)
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Total Emissions (tCO₂e)
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Activity Count
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                    Avg per Activity (kgCO₂e)
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyTrend.map((item, index) => {
                  const monthNames = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ];
                  const monthName = monthNames[item._id.month - 1];
                  const avgPerActivity =
                    item.activityCount > 0
                      ? item.totalEmissions / item.activityCount
                      : 0;
                  return (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">
                        {monthName} {item._id.year}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.totalEmissions.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {(item.totalEmissions / 1000).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.activityCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {avgPerActivity.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(!analytics?.monthlyTrend ||
        analytics.monthlyTrend.length === 0) &&
        (!analytics?.categoryBreakdown ||
          analytics.categoryBreakdown.length === 0) && (
          <Card>
            <div className="text-center py-12">
              <BarChart3 className="mx-auto mb-4 text-gray-300" size={64} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Data Available
              </h2>
              <p className="text-gray-600">
                No analytics data found for the selected period.
              </p>
            </div>
          </Card>
        )}
    </div>
  );
}
