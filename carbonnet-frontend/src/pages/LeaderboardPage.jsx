import React from "react";
import { Card, Select } from "../components/ui";
import { useState, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";
import { Award } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadLeaderboard();
  }, [period, limit]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.users.getLeaderboard({ period, limit });
      setLeaderboard(response.data || []);
    } catch (error) {
      addToast("Failed to load leaderboard", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-2">See how you compare with others</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-4 flex-wrap">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "year", label: "This Year" },
            ]}
          />
          <Select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            options={[
              { value: 10, label: "Top 10" },
              { value: 25, label: "Top 25" },
              { value: 50, label: "Top 50" },
              { value: 100, label: "Top 100" },
            ]}
          />
        </div>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Emissions (kg CO₂e)
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Activities
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <tr
                      key={entry._id || index}
                      className={`hover:bg-gray-50 ${
                        entry._id === user?._id ? "bg-emerald-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <span
                              className={`text-2xl ${
                                index === 0
                                  ? "text-amber-500"
                                  : index === 1
                                  ? "text-gray-400"
                                  : "text-amber-700"
                              }`}
                            >
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {entry.name || entry.user?.name}
                        {entry._id === user?._id && (
                          <span className="ml-2 text-xs text-emerald-600">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {entry.userType || "User"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                        {(entry.totalEmissions || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.activityCount || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Award size={16} className="text-amber-500" />
                          <span className="font-semibold">
                            {entry.totalPoints || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No leaderboard data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LeaderboardPage;
