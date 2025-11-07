import React, { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import api from "../../api/client";
import { Card } from "../../components/ui";
import { Plus, Loader2, Trash2, Edit2, X } from "lucide-react";

export default function MangeChallengePage() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "sustainability",
    type: "individual",
    points: 50,
    isActive: true,
    scope: "institution",
    duration: {
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
    goals: { target: 10, unit: "activities" },
    rules: { maxParticipants: 0 },
    featured: false,
  });

  useEffect(() => {
    loadChallenges(1);
  }, []);

  const loadChallenges = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.challenges.getAll({ page, limit: 20 });
      setChallenges(res.data.challenges || []);
      setPagination({
        page: res.data.currentPage || 1,
        pages: res.data.totalPages || 1,
        total: res.data.totalChallenges || 0,
      });
    } catch (e) {
      addToast(e.message || "Failed to load challenges", "error");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async () => {
    setSaving(true);
    try {
      await api.challenges.create(form);
      addToast("Challenge created", "success");
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        category: "sustainability",
        type: "individual",
        points: 50,
        isActive: true,
        scope: "institution",
        duration: {
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 7 * 86400000)
            .toISOString()
            .slice(0, 10),
        },
        goals: { target: 10, unit: "activities" },
        rules: { maxParticipants: 0 },
        featured: false,
      });
      loadChallenges(pagination.page);
    } catch (e) {
      addToast(e.message || "Failed to create challenge", "error");
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async () => {
    setSaving(true);
    try {
      await api.challenges.update(editing._id, form);
      addToast("Challenge updated", "success");
      setShowForm(false);
      setEditing(null);
      loadChallenges(pagination.page);
    } catch (e) {
      addToast(e.message || "Failed to update challenge", "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this challenge?")) return;
    try {
      await api.challenges.delete(id);
      addToast("Challenge deleted", "success");
      loadChallenges(pagination.page);
    } catch (e) {
      addToast(e.message || "Failed to delete challenge", "error");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Challenges
          </h1>
          <p className="text-gray-600 mt-2">Create and manage challenges</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} /> New Challenge
        </button>
      </div>

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
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Points</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2">Featured</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c._id} className="border-t text-sm">
                    <td className="px-4 py-2">{c.title}</td>
                    <td className="px-4 py-2 capitalize">{c.type}</td>
                    <td className="px-4 py-2">{c.points}</td>
                    <td className="px-4 py-2">{c.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{c.featured ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">
                      {new Date(c.duration.startDate).toLocaleDateString()} -{" "}
                      {new Date(c.duration.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 rounded border"
                          onClick={() => {
                            setEditing(c);
                            setForm({
                              title: c.title,
                              description: c.description,
                              category: c.category,
                              type: c.type,
                              points: c.points,
                              isActive: c.isActive,
                              scope: c.scope,
                              duration: {
                                startDate: new Date(c.duration.startDate)
                                  .toISOString()
                                  .slice(0, 10),
                                endDate: new Date(c.duration.endDate)
                                  .toISOString()
                                  .slice(0, 10),
                              },
                              goals: c.goals || {
                                target: 10,
                                unit: "activities",
                              },
                              rules: c.rules || { maxParticipants: 0 },
                              featured: c.featured,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="px-2 py-1 rounded border text-red-600"
                          onClick={() => onDelete(c._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {challenges.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No challenges found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
            <button
              className="absolute right-4 top-4"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              <X />
            </button>
            <h3 className="text-xl font-semibold mb-4">
              {editing ? "Edit" : "New"} Challenge
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="institution">Institution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.points}
                  onChange={(e) =>
                    setForm({ ...form, points: parseInt(e.target.value || 0) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Featured
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.featured ? "true" : "false"}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.value === "true" })
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Active</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.duration.startDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration: { ...form.duration, startDate: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={form.duration.endDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration: { ...form.duration, endDate: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button
                onClick={editing ? onUpdate : onCreate}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editing ? (
                  "Update"
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
