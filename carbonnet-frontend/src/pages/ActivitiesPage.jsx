import React from "react";
import { useState, useEffect } from "react";
import { Card } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";
import { Button, Input, Select, Modal } from "../components/ui";
import {
  Plus,
  Upload,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

const ActivitiesPage = () => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [page]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await api.activities.getAll({ page, limit: 20 });
      setActivities(response.data.activities || response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      addToast("Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
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
          <Button variant="outline" icon={Upload}>
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
            options={[
              { value: "", label: "All Categories" },
              { value: "transportation", label: "Transportation" },
              { value: "electricity", label: "Electricity" },
              { value: "food", label: "Food" },
              { value: "waste", label: "Waste" },
              { value: "water", label: "Water" },
            ]}
            className="min-w-[200px]"
          />
          <Input type="date" className="min-w-[150px]" />
          <Input type="date" className="min-w-[150px]" />
          <Button variant="outline" icon={Filter}>
            Apply
          </Button>
          <Button variant="ghost" icon={RefreshCw}>
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
                          {new Date(activity.date).toLocaleDateString()}
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
                          {activity.totalEmissions?.toFixed(2) || 0}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit"
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
    </div>
  );
};

const ActivityFormModal = ({ isOpen, onClose, activity, onSuccess }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    category: "transportation",
    date: new Date().toISOString().split("T")[0],
    description: "",
    data: {},
  });
  const [estimatedEmissions, setEstimatedEmissions] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        category: activity.category,
        date: new Date(activity.date).toISOString().split("T")[0],
        description: activity.description || "",
        data: activity.data || {},
      });
    }
  }, [activity]);

  const handleEstimate = async () => {
    setIsEstimating(true);
    try {
      const response = await api.activities.estimate({
        category: formData.category,
        data: formData.data,
      });
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
      if (activity) {
        await api.activities.update(activity._id, formData);
        addToast("Activity updated successfully", "success");
      } else {
        await api.activities.create(formData);
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
                { value: "bus", label: "Bus" },
                { value: "train", label: "Train" },
                { value: "flight", label: "Flight" },
                { value: "bike", label: "Bike" },
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
                { value: "electric", label: "Electric" },
                { value: "hybrid", label: "Hybrid" },
              ]}
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
            <Input
              label="Source (optional)"
              value={formData.data.source || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  data: { ...formData.data, source: e.target.value },
                })
              }
              placeholder="e.g., Solar, Grid"
            />
          </>
        );
      case "food":
        return (
          <>
            <Select
              label="Meal Type"
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
                { value: "vegan", label: "Vegan" },
                { value: "vegetarian", label: "Vegetarian" },
                { value: "pescatarian", label: "Pescatarian" },
                { value: "meat", label: "Meat-based" },
              ]}
            />
          </>
        );
      default:
        return (
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
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  {estimatedEmissions.totalEmissions?.toFixed(2)} kg CO₂e
                </p>
                {estimatedEmissions.confidence && (
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence:{" "}
                    {(estimatedEmissions.confidence * 100).toFixed(0)}%
                  </p>
                )}
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

export default ActivitiesPage;
