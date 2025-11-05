import React from "react";
import { Card, Input, Button, StatCard } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import {
  Activity,
  Calendar,
  TrendingDown,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/client";

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
      setStatistics(response.data);
    } catch (error) {
      addToast("Failed to load statistics", "error");
    } finally {
      setLoading(false);
    }
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
        <Button variant="outline" icon={Download}>
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
            <Card>
              <h3 className="text-xl font-bold mb-4">Emissions by Category</h3>
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 size={64} className="mx-auto mb-4" />
                  <p>Bar chart visualization</p>
                  <p className="text-sm mt-2">
                    Transportation, Electricity, Food, etc.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold mb-4">Monthly Trend</h3>
              <div className="h-80 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity size={64} className="mx-auto mb-4" />
                  <p>Line chart visualization</p>
                  <p className="text-sm mt-2">Emissions over time</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {statistics?.categoryBreakdown?.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium capitalize">
                    {cat.category}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full"
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
              )) || (
                <p className="text-center text-gray-500 py-8">
                  No category data available
                </p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
