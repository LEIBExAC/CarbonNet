import React from "react";
import { Card, Input, Button, StatCard } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import {
  Activity,
  Calendar,
  TrendingDown,
  Download,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/client";
import { EmissionsBarChart, EmissionsPieChart, EmissionsTrendChart } from "../components/charts";

const StatisticsPage = () => {
  const { addToast } = useToast();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.users.getStatistics(dateRange);
      const rawData = response.data;

      // Transform backend response to frontend needs
      const totalEmissions = rawData.totalEmissions || 0;
      const totalActivities = rawData.totalActivities || 0;
      const avgPerActivity = totalActivities > 0 ? totalEmissions / totalActivities : 0;

      // Transform byCategory into categoryBreakdown with percentages
      const categoryBreakdown = [];
      if (rawData.byCategory && totalEmissions > 0) {
        Object.keys(rawData.byCategory).forEach((category) => {
          const catData = rawData.byCategory[category];
          categoryBreakdown.push({
            category,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            emissions: catData.emissions || 0,
            count: catData.count || 0,
            percentage: ((catData.emissions || 0) / totalEmissions) * 100,
          });
        });
        // Sort by emissions descending
        categoryBreakdown.sort((a, b) => b.emissions - a.emissions);
      }

      // Transform monthlyTrend into array format for charts
      const monthlyTrendData = [];
      if (rawData.monthlyTrend) {
        Object.keys(rawData.monthlyTrend).sort().forEach((month) => {
          monthlyTrendData.push({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            emissions: rawData.monthlyTrend[month],
          });
        });
      }

      setStatistics({
        totalEmissions,
        totalActivities,
        avgPerActivity,
        categoryBreakdown,
        monthlyTrendData,
        monthlyTrend: rawData.monthlyTrend || {},
        byCategory: rawData.byCategory || {},
        suggestions: rawData.suggestions || [],
      });
    } catch (error) {
      addToast("Failed to load statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!statistics) {
      addToast("No data to export", "error");
      return;
    }

    const csvContent = [
      ['CarbonNet Statistics Report'],
      [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Summary'],
      ['Total Emissions (kg CO₂e)', statistics.totalEmissions.toFixed(2)],
      ['Total Activities', statistics.totalActivities],
      ['Average per Activity (kg CO₂e)', statistics.avgPerActivity.toFixed(2)],
      [''],
      ['Category Breakdown'],
      ['Category', 'Emissions (kg)', 'Count', 'Percentage'],
      ...statistics.categoryBreakdown.map(cat => [
        cat.name,
        cat.emissions.toFixed(2),
        cat.count,
        cat.percentage.toFixed(1) + '%'
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `carbonnet-statistics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast("Report exported successfully", "success");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-2">
            Analyze your carbon footprint trends
          </p>
        </div>
        <Button variant="outline" icon={Download} onClick={handleExportReport}>
          Export Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <div className="flex gap-4 flex-wrap items-end">
          <Input
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
          />
          <Input
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
          />
          <Button icon={RefreshCw} onClick={loadStatistics}>
            Refresh
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <StatCard
              title="Total Emissions"
              value={`${(statistics?.totalEmissions || 0).toFixed(2)} kg`}
              icon={Activity}
              color="emerald"
            />
            <StatCard
              title="Total Activities"
              value={statistics?.totalActivities || 0}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Average per Activity"
              value={`${(statistics?.avgPerActivity || 0).toFixed(2)} kg`}
              icon={TrendingDown}
              color="amber"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {statistics?.categoryBreakdown && statistics.categoryBreakdown.length > 0 ? (
              <>
                <EmissionsBarChart
                  title="Emissions by Category"
                  data={statistics.categoryBreakdown}
                  dataKey="emissions"
                  nameKey="name"
                />
                <EmissionsPieChart
                  title="Category Distribution"
                  data={statistics.categoryBreakdown}
                  dataKey="emissions"
                  nameKey="name"
                />
              </>
            ) : (
              <>
                <Card>
                  <h3 className="text-xl font-bold mb-4">Emissions by Category</h3>
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    <p>No category data available</p>
                  </div>
                </Card>
                <Card>
                  <h3 className="text-xl font-bold mb-4">Category Distribution</h3>
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    <p>No category data available</p>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Monthly Trend */}
          {statistics?.monthlyTrendData && statistics.monthlyTrendData.length > 0 && (
            <EmissionsTrendChart
              title="Monthly Emissions Trend"
              data={statistics.monthlyTrendData}
              dataKey="emissions"
              nameKey="month"
            />
          )}

          {/* Category Breakdown */}
          <Card>
            <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {statistics?.categoryBreakdown && statistics.categoryBreakdown.length > 0 ? (
                statistics.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium capitalize">
                      {cat.category}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-emerald-500 to-teal-600 h-full"
                          style={{ width: `${cat.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-semibold">
                      {(cat.emissions || 0).toFixed(2)} kg
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">
                      {(cat.percentage || 0).toFixed(1)}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No category data available
                </p>
              )}
            </div>
          </Card>

          {/* Suggestions */}
          <Card>
            <h3 className="text-xl font-bold mb-4">Suggestions to Reduce Emissions</h3>
            {statistics?.suggestions && statistics.suggestions.length > 0 ? (
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-700">
                {statistics.suggestions.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No suggestions available yet. Log more activities to get personalized tips.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
