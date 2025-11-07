import React, { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/ui";
import api from "../../api/client";
import { Plus, Loader2, Search, X } from "lucide-react";

const CATEGORIES = [
  "transportation",
  "electricity",
  "food",
  "waste",
  "water",
  "heating",
  "cooling",
  "paper",
  "fuel",
  "other",
];

export default function EmissionFactorManage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    source: "",
    isActive: "true",
    institutionId: "",
    search: "",
  });
  const [institutions, setInstitutions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFactor, setNewFactor] = useState({
    category: "other",
    subcategory: "",
    description: "",
    factor: "",
    unit: "kg",
    emissionUnit: "kg CO2e",
    scope: 3,
    source: "CUSTOM",
    sourceYear: new Date().getFullYear(),
    region: "IN",
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: "",
    institutionId: "",
    isActive: true,
  });

  useEffect(() => {
    if (isSuperAdmin) loadInstitutions();
    loadFactors(1);
  }, []);

  const loadInstitutions = async () => {
    try {
      const res = await api.admin.getAllInstitutions();
      setInstitutions(res.data.institutions || []);
    } catch (e) {
      // non-blocking
    }
  };

  const loadFactors = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) params[k] = v;
      });
      const res = await api.admin.getEmissionFactors(params);
      setFactors(res.data.factors || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      addToast(e.message || "Failed to load emission factors", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (
      !newFactor.category ||
      !newFactor.subcategory ||
      !newFactor.factor ||
      !newFactor.unit ||
      !newFactor.scope ||
      !newFactor.source
    ) {
      addToast("Please fill all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...newFactor };
      payload.factor = parseFloat(payload.factor);
      if (!payload.validFrom) payload.validFrom = new Date().toISOString();
      if (!isSuperAdmin) delete payload.institutionId;
      const res = await api.admin.createEmissionFactor(payload);
      addToast("Emission factor created", "success");
      setShowCreate(false);
      setNewFactor({
        category: "other",
        subcategory: "",
        description: "",
        factor: "",
        unit: "kg",
        emissionUnit: "kg CO2e",
        scope: 3,
        source: "CUSTOM",
        sourceYear: new Date().getFullYear(),
        region: "IN",
        validFrom: new Date().toISOString().slice(0, 10),
        validUntil: "",
        institutionId: "",
        isActive: true,
      });
      loadFactors(pagination.page);
    } catch (e) {
      addToast(e.message || "Failed to create emission factor", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emission Factors</h1>
          <p className="text-gray-600 mt-2">
            Browse and manage emission factors
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} /> Add Factor
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <input
              value={filters.subcategory}
              onChange={(e) =>
                setFilters({ ...filters, subcategory: e.target.value })
              }
              placeholder="e.g., paper A4, petrol"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) =>
                setFilters({ ...filters, source: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              {["DEFRA", "IPCC", "GHG_PROTOCOL", "EPA", "CUSTOM", "OTHER"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active
            </label>
            <select
              value={filters.isActive}
              onChange={(e) =>
                setFilters({ ...filters, isActive: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution
              </label>
              <select
                value={filters.institutionId}
                onChange={(e) =>
                  setFilters({ ...filters, institutionId: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                {institutions.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search description or subcategory"
                className="w-full pl-9 pr-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => loadFactors(1)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({
                category: "",
                subcategory: "",
                source: "",
                isActive: "",
                institutionId: "",
                search: "",
              });
              loadFactors(1);
            }}
            className="px-4 py-2 rounded-lg border"
          >
            Reset
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin mx-auto text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Subcategory</th>
                  <th className="px-4 py-2">Factor</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Scope</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Institution</th>
                  <th className="px-4 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((f) => (
                  <tr key={f._id} className="border-t text-sm">
                    <td className="px-4 py-2 capitalize">{f.category}</td>
                    <td className="px-4 py-2">{f.subcategory}</td>
                    <td className="px-4 py-2">{f.factor}</td>
                    <td className="px-4 py-2">{f.unit}</td>
                    <td className="px-4 py-2">{f.scope}</td>
                    <td className="px-4 py-2">{f.source}</td>
                    <td className="px-4 py-2">
                      {f.institutionId?.name || "Global"}
                    </td>
                    <td className="px-4 py-2">{f.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
                {factors.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={8}
                    >
                      No factors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
            <button
              className="absolute right-4 top-4"
              onClick={() => setShowCreate(false)}
            >
              <X />
            </button>
            <h3 className="text-xl font-semibold mb-4">Add Emission Factor</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={newFactor.category}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subcategory
                </label>
                <input
                  value={newFactor.subcategory}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, subcategory: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., A4 paper, petrol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Factor</label>
                <input
                  type="number"
                  value={newFactor.factor}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, factor: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  value={newFactor.unit}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., kg, kWh, L"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scope</label>
                <select
                  value={newFactor.scope}
                  onChange={(e) =>
                    setNewFactor({
                      ...newFactor,
                      scope: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select
                  value={newFactor.source}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, source: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[
                    "DEFRA",
                    "IPCC",
                    "GHG_PROTOCOL",
                    "EPA",
                    "CUSTOM",
                    "OTHER",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input
                  value={newFactor.description}
                  onChange={(e) =>
                    setNewFactor({ ...newFactor, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              {isSuperAdmin && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Institution (optional)
                  </label>
                  <select
                    value={newFactor.institutionId}
                    onChange={(e) =>
                      setNewFactor({
                        ...newFactor,
                        institutionId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Global</option>
                    {institutions.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
