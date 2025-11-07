import React from "react";
import { useEffect, useState } from "react";
import api from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { StatCard, Card } from "../components/ui";
import { Activity, TrendingDown, Award, Leaf } from "lucide-react";
import { EmissionsBarChart, EmissionsPieChart } from "../components/charts";
import { formatNumber, formatEmissions } from "../utils/helpers";

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.users.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const recentActivities = dashboard?.recentActivities || [];
  // Transform emissionsByCategory to chart-friendly breakdown if present
  const categoryBreakdown = dashboard?.emissionsByCategory
    ? Object.entries(dashboard.emissionsByCategory).map(([category, emissions]) => ({
        category,
        emissions,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's your carbon footprint overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Emissions"
          value={formatEmissions(summary.monthlyEmissions || 0)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Activities Logged"
          value={formatNumber(summary.totalActivities || 0, 0)}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Points Earned"
          value={formatNumber(summary.totalPoints || 0, 0)}
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Streak Days"
          value={formatNumber(summary.currentStreak || 0, 0)}
          icon={Leaf}
          color="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryBreakdown.length > 0 && (
          <EmissionsPieChart
            title="Emissions by Category"
            data={categoryBreakdown}
            dataKey="emissions"
            nameKey="category"
          />
        )}

        {categoryBreakdown.length > 0 && (
          <EmissionsBarChart
            title="Category Breakdown"
            data={categoryBreakdown}
            dataKey="emissions"
            nameKey="category"
          />
        )}
      </div>

      {/* Recent Activities */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No activities logged yet
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {activity.category}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">
                    {formatEmissions(activity.carbonEmission || activity.totalEmissions || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
