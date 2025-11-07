import React from "react";
import { useState, useEffect } from "react";
import { Card } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";
import { Button, Input, Select, Modal } from "../components/ui";
import FileUpload from "../components/FileUpload";
import {
  Plus,
  Upload,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
} from "lucide-react";

const ActivitiesPage = () => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadActivities();
  }, [page, filters]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.activities.getAll(params);
      setActivities(response.data.activities || response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      addToast("Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1); // Reset to first page when filters change
    loadActivities();
  };

  const handleResetFilters = () => {
    setFilters({ category: "", startDate: "", endDate: "" });
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      await api.activities.delete(id);
      addToast("Activity deleted successfully", "success");
      loadActivities();
    } catch (error) {
      addToast("Failed to delete activity", "error");
    }
  };

  const handleBulkUpload = async (files) => {
    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("category", "all"); // Backend will parse category from file content

    try {
      const response = await api.upload.bulkActivities(formData);
      const imported = response.data?.imported || response.data?.count || 0;
      addToast(`Successfully imported ${imported} activities`, "success");
      setShowUploadModal(false);

      // Reset filters and reload activities
      setFilters({ category: "", startDate: "", endDate: "" });
      setPage(1);

      // Small delay to ensure backend has processed everything
      setTimeout(() => {
        loadActivities();
        // Fire and forget refresh of dashboard/statistics dependent data
        api.users.getDashboard().catch(() => {});
        api.users.getStatistics({ startDate: "", endDate: "" }).catch(() => {});
      }, 600);
    } catch (error) {
      throw new Error(error.message || "Failed to upload activities file");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your carbon emissions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setShowUploadModal(true)}
          >
            Upload File
          </Button>
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Log Activity
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-4 flex-wrap">
          <Select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            options={[
              { value: "", label: "All Categories" },
              { value: "transportation", label: "Transportation" },
              { value: "electricity", label: "Electricity" },
              { value: "food", label: "Food" },
              { value: "waste", label: "Waste" },
              { value: "water", label: "Water" },
              { value: "other", label: "Other" },
            ]}
            className="min-w-[200px]"
          />
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="min-w-[150px]"
          />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="min-w-[150px]"
          />
          <Button variant="outline" icon={Filter} onClick={handleApplyFilters}>
            Apply
          </Button>
          <Button variant="ghost" icon={RefreshCw} onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Activities Table */}
      <Card>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Emissions (kg CO₂e)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <tr key={activity._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(
                            activity.activityDate ||
                              activity.date ||
                              activity.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs capitalize">
                            {activity.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {activity.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                          {typeof activity.carbonEmission === "number"
                            ? activity.carbonEmission.toFixed(2)
                            : activity.totalEmissions
                            ? activity.totalEmissions.toFixed(2)
                            : "0.00"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View"
                              onClick={() => {
                                setCurrentActivity(activity);
                                setShowModal(true);
                              }}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit"
                              onClick={() => {
                                setCurrentActivity(activity);
                                setShowModal(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                              title="Delete"
                              onClick={() => handleDelete(activity._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No activities found. Start by logging your first
                        activity!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Log Activity Modal */}
      <ActivityFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCurrentActivity(null);
        }}
        activity={currentActivity}
        onSuccess={() => {
          loadActivities();
          setShowModal(false);
          setCurrentActivity(null);
        }}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleBulkUpload}
      />
    </div>
  );
};

const ActivityFormModal = ({ isOpen, onClose, activity, onSuccess }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    category: "transportation",
    activityDate: new Date().toISOString().split("T")[0],
    description: "",
    data: {},
  });
  const [estimatedEmissions, setEstimatedEmissions] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activity) {
      // Map existing activity into form shape
      const mapped = {
        category: activity.category,
        description: activity.description || "",
        data: {},
        activityDate: new Date(activity.activityDate || activity.date)
          .toISOString()
          .split("T")[0],
      };
      if (activity.category && activity[activity.category]) {
        mapped.data = activity[activity.category];
      } else if (activity.quantity) {
        mapped.data = { quantity: activity.quantity, unit: activity.unit };
      }
      setFormData(mapped);
    }
  }, [activity]);

  const buildActivityPayload = () => {
    const { category, activityDate, description, data } = formData;
    const payload = { category, activityDate };

    if (category === "other") {
      payload.quantity = data?.quantity;
      payload.unit = data?.unit || "kg";
      // Include activity type info in description or subcategory for AI context
      payload.subcategory = data?.activityType || "";
      payload.description = description || data?.activityType || "";
    } else {
      payload[category] = { ...data };
      payload.description = description;
    }
    return payload;
  };

  const handleEstimate = async () => {
    setIsEstimating(true);
    try {
      const response = await api.activities.estimate(buildActivityPayload());
      setEstimatedEmissions(response.data);
      addToast("Emissions estimated successfully", "success");
    } catch (error) {
      addToast("Failed to estimate emissions", "error");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildActivityPayload();
      if (activity) {
        await api.activities.update(activity._id, payload);
        addToast("Activity updated successfully", "success");
      } else {
        await api.activities.create(payload);
        addToast("Activity created successfully", "success");
      }
      onSuccess();
    } catch (error) {
      addToast(error.message || "Failed to save activity", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryFields = () => {
    switch (formData.category) {
      case "transportation":
        return (
          <>
            <Select
              label="Mode"
              value={formData.data.mode || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, mode: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select mode" },
                { value: "car", label: "Car" },
                { value: "bike", label: "Bike" },
                { value: "bus", label: "Bus" },
                { value: "train", label: "Train" },
                { value: "metro", label: "Metro" },
                { value: "rickshaw", label: "Rickshaw" },
                { value: "walk", label: "Walk" },
                { value: "flight", label: "Flight" },
                { value: "other", label: "Other" },
              ]}
            />
            <Input
              label="Distance (km)"
              type="number"
              step="0.1"
              value={formData.data.distance || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    distance: parseFloat(e.target.value),
                  },
                })
              }
            />
            <Select
              label="Fuel Type"
              value={formData.data.fuelType || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, fuelType: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select fuel type" },
                { value: "petrol", label: "Petrol" },
                { value: "diesel", label: "Diesel" },
                { value: "cng", label: "CNG" },
                { value: "electric", label: "Electric" },
                { value: "hybrid", label: "Hybrid" },
                { value: "none", label: "None" },
              ]}
            />
            <Input
              label="Passengers (optional)"
              type="number"
              step="1"
              value={formData.data.passengers || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    passengers: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  },
                })
              }
            />
          </>
        );
      case "electricity":
        return (
          <>
            <Input
              label="Consumption (kWh)"
              type="number"
              step="0.1"
              value={formData.data.consumption || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    consumption: parseFloat(e.target.value),
                  },
                })
              }
            />
            <Select
              label="Source"
              value={formData.data.source || "grid"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, source: e.target.value },
                })
              }
              options={[
                { value: "grid", label: "Grid" },
                { value: "solar", label: "Solar" },
                { value: "wind", label: "Wind" },
                { value: "hybrid", label: "Hybrid" },
              ]}
            />
            <Input
              label="Appliance (optional)"
              value={formData.data.appliance || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, appliance: e.target.value },
                })
              }
            />
          </>
        );
      case "food":
        return (
          <>
            <Select
              label="Meal Type (optional)"
              value={formData.data.mealType || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, mealType: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select meal type" },
                { value: "breakfast", label: "Breakfast" },
                { value: "lunch", label: "Lunch" },
                { value: "dinner", label: "Dinner" },
                { value: "snack", label: "Snack" },
              ]}
            />
            <Select
              label="Diet Type"
              value={formData.data.dietType || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, dietType: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select diet type" },
                { value: "veg", label: "Vegetarian (Veg)" },
                { value: "non-veg", label: "Non-vegetarian" },
                { value: "vegan", label: "Vegan" },
              ]}
            />
            <Input
              label="Quantity"
              type="number"
              step="0.1"
              value={formData.data.quantity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    quantity: parseFloat(e.target.value),
                  },
                })
              }
            />
            <Input
              label="Food Waste (kg, optional)"
              type="number"
              step="0.1"
              value={formData.data.foodWaste || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    foodWaste: parseFloat(e.target.value),
                  },
                })
              }
            />
          </>
        );
      case "waste":
        return (
          <>
            <Select
              label="Waste Type"
              value={formData.data.type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, type: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select type" },
                { value: "paper", label: "Paper" },
                { value: "plastic", label: "Plastic" },
                { value: "food", label: "Food" },
                { value: "electronic", label: "Electronic" },
                { value: "general", label: "General" },
              ]}
            />
            <Input
              label="Quantity (kg)"
              type="number"
              step="0.1"
              value={formData.data.quantity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    quantity: parseFloat(e.target.value),
                  },
                })
              }
            />
            <div className="flex items-center gap-2">
              <input
                id="recycled"
                type="checkbox"
                checked={!!formData.data.recycled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    data: { ...formData.data, recycled: e.target.checked },
                  })
                }
              />
              <label htmlFor="recycled">Recycled</label>
            </div>
          </>
        );
      case "water":
        return (
          <>
            <Input
              label="Consumption (liters)"
              type="number"
              step="0.1"
              value={formData.data.consumption || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    consumption: parseFloat(e.target.value),
                  },
                })
              }
            />
            <Select
              label="Usage (optional)"
              value={formData.data.usage || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, usage: e.target.value },
                })
              }
              options={[
                { value: "", label: "Select usage" },
                { value: "drinking", label: "Drinking" },
                { value: "washing", label: "Washing" },
                { value: "cleaning", label: "Cleaning" },
                { value: "gardening", label: "Gardening" },
                { value: "other", label: "Other" },
              ]}
            />
          </>
        );
      default:
        return (
          <>
            <Input
              label="Activity Type"
              placeholder="e.g., Paper usage, Event hosting, Heating, Cooling"
              value={formData.data.activityType || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, activityType: e.target.value },
                })
              }
              required
            />
            <Input
              label="Quantity"
              type="number"
              step="0.1"
              value={formData.data.quantity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: {
                    ...formData.data,
                    quantity: parseFloat(e.target.value),
                  },
                })
              }
              required
            />
            <Input
              label="Unit"
              placeholder="e.g., kg, kWh, hours, sheets"
              value={formData.data.unit || "kg"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, unit: e.target.value },
                })
              }
            />
          </>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Edit Activity" : "Log New Activity"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value, data: {} })
          }
          options={[
            { value: "transportation", label: "Transportation" },
            { value: "electricity", label: "Electricity" },
            { value: "food", label: "Food" },
            { value: "waste", label: "Waste" },
            { value: "water", label: "Water" },
            { value: "other", label: "Other" },
          ]}
        />

        <Input
          label="Date"
          type="date"
          value={formData.activityDate}
          onChange={(e) =>
            setFormData({ ...formData, activityDate: e.target.value })
          }
          max={new Date().toISOString().split("T")[0]}
        />

        {renderCategoryFields()}

        <Input
          label="Description (optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Add any additional details..."
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleEstimate}
            loading={isEstimating}
            className="flex-1"
          >
            Estimate Emissions
          </Button>
        </div>

        {estimatedEmissions && (
          <Card className="bg-emerald-50 border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Emissions</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {Number(estimatedEmissions.carbonEmission || 0).toFixed(2)} kg
                  CO₂e
                </p>
              </div>
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
          </Card>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            {activity ? "Update" : "Save"} Activity
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Bulk Upload Modal Component
const BulkUploadModal = ({ isOpen, onClose, onUpload }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Upload Activities">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload a CSV or Excel file containing multiple activities. The file
          should include columns for category, date, and category-specific
          fields.
        </p>
        <FileUpload
          onUpload={onUpload}
          acceptedFormats={{
            "text/csv": [".csv"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
          }}
          maxSize={10485760} // 10MB
          multiple={false}
        />
        <div className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ActivitiesPage;
