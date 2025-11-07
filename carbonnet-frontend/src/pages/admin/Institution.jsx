import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Card, StatCard } from "../../components/ui";
import api from "../../api/client";
import {
  Building2,
  Users,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Award,
  Activity,
  Loader2,
} from "lucide-react";

export default function Institution() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [joinRequests, setJoinRequests] = useState([]);
  const [jrLoading, setJrLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "superadmin") {
      loadAllInstitutions();
    } else {
      loadMyInstitutions();
    }
  }, [user]);
  const loadAllInstitutions = async () => {
    setLoading(true);
    try {
      const response = await api.admin.getAllInstitutions();
      const fetchedInstitutions = response.data.institutions || [];
      setInstitutions(fetchedInstitutions);

      if (fetchedInstitutions.length === 0) {
        addToast("No institutions found", "error");
        setLoading(false);
        return;
      }

      if (fetchedInstitutions.length === 1) {
        setSelectedInstitutionId(fetchedInstitutions[0]._id);
      } else if (fetchedInstitutions.length > 1) {
        setSelectedInstitutionId(fetchedInstitutions[0]._id);
      }
    } catch (error) {
      addToast(error.message || "Failed to load institutions", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstitutionId) {
      loadInstitutionData(selectedInstitutionId);
    }
  }, [selectedInstitutionId]);

  const loadMyInstitutions = async () => {
    setLoading(true);
    try {
      const response = await api.institutions.getMyInstitutions();
      const fetchedInstitutions = response.data.institutions || [];

      setInstitutions(fetchedInstitutions);

      if (fetchedInstitutions.length === 0) {
        addToast("You are not an admin of any institution", "error");
        setLoading(false);
        return;
      }

      if (fetchedInstitutions.length === 1) {
        setSelectedInstitutionId(fetchedInstitutions[0]._id);
      } else if (fetchedInstitutions.length > 1) {
        setSelectedInstitutionId(fetchedInstitutions[0]._id);
      }
    } catch (error) {
      addToast(error.message || "Failed to load institutions", "error");
      setLoading(false);
    }
  };

  const loadInstitutionData = async (institutionId) => {
    if (!institutionId) return;

    setLoading(true);
    try {
      const institutionResponse = await api.institutions.getById(institutionId);
      setInstitution(institutionResponse.data.institution);

      try {
        const dashboardResponse = await api.institutions.getDashboard(
          institutionId
        );
        setDashboard(dashboardResponse.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      }

      try {
        const departmentsResponse = await api.institutions.getDepartments(
          institutionId
        );
        setDepartments(departmentsResponse.data.departments || []);
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    } catch (error) {
      addToast(error.message || "Failed to load institution details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    if (!selectedInstitutionId) return;
    setJrLoading(true);
    try {
      const res = await api.institutionRequests.list({
        institutionId: selectedInstitutionId,
        status: "pending",
        page: 1,
        limit: 50,
      });
      setJoinRequests(res.data.requests || []);
    } catch (e) {
      // ignore
    } finally {
      setJrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto mb-4 text-emerald-600"
            size={48}
          />
          <p className="text-gray-600">Loading institution details...</p>
        </div>
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-12">
            <Building2 className="mx-auto mb-4 text-gray-300" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Institution Found
            </h2>
            <p className="text-gray-600">
              You are not an admin of any institution.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Institution Details
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage your institution information
        </p>
      </div>

      {institutions.length > 1 && (
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Institution
          </label>
          <select
            value={selectedInstitutionId || ""}
            onChange={(e) => setSelectedInstitutionId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {institutions.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name} ({inst.code})
              </option>
            ))}
          </select>
        </Card>
      )}

      {!institution ? (
        <Card>
          <div className="text-center py-12">
            <Loader2
              className="animate-spin mx-auto mb-4 text-emerald-600"
              size={48}
            />
            <p className="text-gray-600">Loading institution details...</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 border-b">
            {[
              { id: "overview", label: "Overview" },
              { id: "dashboard", label: "Dashboard" },
              { id: "departments", label: "Departments" },
              { id: "admins", label: "Admins" },
              ...(user?.role === "admin" || user?.role === "superadmin"
                ? [{ id: "joinRequests", label: "Join Requests" }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-emerald-600 text-emerald-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "joinRequests" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Pending Join Requests</h3>
                <button
                  className="px-3 py-2 rounded border"
                  onClick={loadJoinRequests}
                >
                  {jrLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Message</th>
                      <th className="px-4 py-2">Requested At</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinRequests.map((r) => (
                      <tr key={r._id} className="border-t text-sm">
                        <td className="px-4 py-2">{r.userId?.name}</td>
                        <td className="px-4 py-2">{r.userId?.email}</td>
                        <td className="px-4 py-2">{r.message || "-"}</td>
                        <td className="px-4 py-2">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1 rounded bg-emerald-600 text-white"
                              onClick={async () => {
                                await api.institutionRequests.approve(r._id);
                                loadJoinRequests();
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-1 rounded border"
                              onClick={async () => {
                                await api.institutionRequests.reject(r._id);
                                loadJoinRequests();
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {joinRequests.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-gray-500"
                          colSpan={5}
                        >
                          No pending requests
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Institution Basic Info */}
              <Card>
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-emerald-100 rounded-lg">
                    <Building2 className="text-emerald-600" size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {institution.name}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500">Code:</span>
                        <span className="font-semibold">
                          {institution.code}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-semibold capitalize">
                          {institution.type}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500">Status:</span>
                        <span
                          className={`font-semibold ${
                            institution.isActive
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {institution.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {institution.population?.total && (
                        <div className="flex items-start gap-3">
                          <span className="text-gray-500">
                            Total Population:
                          </span>
                          <span className="font-semibold">
                            {institution.population.total.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Information */}
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {institution.contactInfo?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {institution.contactInfo.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {institution.contactInfo?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {institution.contactInfo.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {institution.contactInfo?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a
                          href={institution.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-emerald-600 hover:underline"
                        >
                          {institution.contactInfo.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {institution.adminEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Admin Email</p>
                        <p className="font-medium">{institution.adminEmail}</p>
                      </div>
                    </div>
                  )}
                </div>

                {institution.address && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Address</p>
                        <p className="font-medium">
                          {[
                            institution.address.street,
                            institution.address.city,
                            institution.address.state,
                            institution.address.country,
                            institution.address.zipCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Population Stats */}
              {institution.population && (
                <div className="grid md:grid-cols-4 gap-4">
                  {institution.population.students !== undefined && (
                    <StatCard
                      title="Students"
                      value={institution.population.students.toLocaleString()}
                      icon={Users}
                      color="blue"
                    />
                  )}
                  {institution.population.faculty !== undefined && (
                    <StatCard
                      title="Faculty"
                      value={institution.population.faculty.toLocaleString()}
                      icon={Users}
                      color="purple"
                    />
                  )}
                  {institution.population.staff !== undefined && (
                    <StatCard
                      title="Staff"
                      value={institution.population.staff.toLocaleString()}
                      icon={Users}
                      color="amber"
                    />
                  )}
                  {institution.population.total !== undefined && (
                    <StatCard
                      title="Total"
                      value={institution.population.total.toLocaleString()}
                      icon={Users}
                      color="emerald"
                    />
                  )}
                </div>
              )}

              {/* Sustainability Goals */}
              {institution.sustainabilityGoals && (
                <Card>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Sustainability Goals
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {institution.sustainabilityGoals.targetReduction && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Target Reduction
                        </p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {institution.sustainabilityGoals.targetReduction}%
                        </p>
                      </div>
                    )}
                    {institution.sustainabilityGoals.baselineYear && (
                      <div>
                        <p className="text-sm text-gray-500">Baseline Year</p>
                        <p className="text-2xl font-bold">
                          {institution.sustainabilityGoals.baselineYear}
                        </p>
                      </div>
                    )}
                    {institution.sustainabilityGoals.targetYear && (
                      <div>
                        <p className="text-sm text-gray-500">Target Year</p>
                        <p className="text-2xl font-bold">
                          {institution.sustainabilityGoals.targetYear}
                        </p>
                      </div>
                    )}
                    {institution.sustainabilityGoals.baselineEmissions && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Baseline Emissions
                        </p>
                        <p className="text-2xl font-bold">
                          {institution.sustainabilityGoals.baselineEmissions.toLocaleString()}{" "}
                          CO₂e
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Settings */}
              {institution.settings && (
                <Card>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Self Registration</span>
                      <span
                        className={`font-semibold ${
                          institution.settings.allowSelfRegistration
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {institution.settings.allowSelfRegistration
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email Verification</span>
                      <span
                        className={`font-semibold ${
                          institution.settings.requireEmailVerification
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {institution.settings.requireEmailVerification
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Gamification</span>
                      <span
                        className={`font-semibold ${
                          institution.settings.enableGamification
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {institution.settings.enableGamification
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Public Dashboard</span>
                      <span
                        className={`font-semibold ${
                          institution.settings.publicDashboard
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {institution.settings.publicDashboard
                          ? "Public"
                          : "Private"}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && dashboard && (
            <div className="space-y-6">
              {/* Emission Summary */}
              {dashboard.emissionSummary && (
                <div className="grid md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Emissions"
                    value={
                      dashboard.emissionSummary.totalEmissions
                        ? `${dashboard.emissionSummary.totalEmissions.toFixed(
                            2
                          )} tCO₂e`
                        : "0 tCO₂e"
                    }
                    icon={Activity}
                    color="red"
                  />
                  <StatCard
                    title="Activities"
                    value={
                      dashboard.emissionSummary.totalActivities?.toLocaleString() ||
                      "0"
                    }
                    icon={Activity}
                    color="blue"
                  />
                  <StatCard
                    title="Average per Activity"
                    value={
                      dashboard.emissionSummary.averageEmissions
                        ? `${dashboard.emissionSummary.averageEmissions.toFixed(
                            2
                          )} kgCO₂e`
                        : "0 kgCO₂e"
                    }
                    icon={TrendingUp}
                    color="purple"
                  />
                  <StatCard
                    title="Categories"
                    value={
                      dashboard.emissionSummary.categoryBreakdown?.length || 0
                    }
                    icon={Award}
                    color="amber"
                  />
                </div>
              )}

              {/* User Stats */}
              {dashboard.users && (
                <div className="grid md:grid-cols-3 gap-4">
                  <StatCard
                    title="Total Users"
                    value={dashboard.users.total?.toLocaleString() || "0"}
                    icon={Users}
                    color="blue"
                  />
                  <StatCard
                    title="Active Users"
                    value={dashboard.users.active?.toLocaleString() || "0"}
                    icon={Users}
                    color="emerald"
                  />
                  {dashboard.users.breakdown && (
                    <Card>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        User Breakdown
                      </h3>
                      <div className="space-y-2">
                        {dashboard.users.breakdown.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-600 capitalize">
                              {item._id || "Unknown"}
                            </span>
                            <span className="font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Top Contributors */}
              {dashboard.topContributors &&
                dashboard.topContributors.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Top Contributors
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-gray-600">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-gray-600">
                              Type
                            </th>
                            <th className="text-right py-3 px-4 text-gray-600">
                              Total Emissions
                            </th>
                            <th className="text-right py-3 px-4 text-gray-600">
                              Activities
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.topContributors.map(
                            (contributor, index) => (
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {contributor.name || "Unknown"}
                                </td>
                                <td className="py-3 px-4 capitalize">
                                  {contributor.userType || "N/A"}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {contributor.totalEmissions?.toFixed(2) ||
                                    "0"}{" "}
                                  kgCO₂e
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {contributor.activityCount || 0}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              {departments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {departments.map((dept, index) => (
                    <Card key={index} hover>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {dept.name}
                      </h3>
                      {dept.code && (
                        <p className="text-sm text-gray-600 mb-2">
                          Code: {dept.code}
                        </p>
                      )}
                      {dept.head && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-500">Head</p>
                          <p className="font-medium">{dept.head}</p>
                        </div>
                      )}
                      {dept.contactEmail && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Contact</p>
                          <a
                            href={`mailto:${dept.contactEmail}`}
                            className="font-medium text-emerald-600 hover:underline"
                          >
                            {dept.contactEmail}
                          </a>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <Building2
                      className="mx-auto mb-4 text-gray-300"
                      size={48}
                    />
                    <p className="text-gray-500">No departments found</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Institution Administrators
                </h3>
                {institution.admins && institution.admins.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      {institution.admins.length} administrator
                      {institution.admins.length !== 1 ? "s" : ""} associated
                      with this institution.
                    </p>
                    <p className="text-sm text-gray-500">
                      Admin details would be displayed here when available.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500">No administrators found</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
