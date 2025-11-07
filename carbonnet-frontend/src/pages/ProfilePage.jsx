import React from "react";
import { Card } from "../components/ui";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Edit2, Award } from "lucide-react";
import { Button, Input } from "../components/ui";
import api from "../api/client";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    department: user?.department || "",
    carbonFootprintGoal: user?.carbonFootprintGoal || "",
  });
  const [saving, setSaving] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoinByCode = async () => {
    if (!joinCode) {
      addToast("Please enter an institution code", "error");
      return;
    }
    setJoinLoading(true);
    try {
      await api.institutions.requestJoinByCode({
        code: joinCode,
        message: joinMsg,
      });
      addToast("Join request submitted", "success");
      setJoinCode("");
      setJoinMsg("");
    } catch (e) {
      addToast(e.message || "Failed to submit request", "error");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.users.updateProfile(formData);
      console.log("Profile updated:", response);
      addToast("Profile updated successfully", "success");
      setIsEditing(false);
      // Reload the page to refresh user data
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Profile update error:", error);
      addToast(error.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="w-24 h-24 bg-linear-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {(user?.name || "").charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600 mt-1">{user?.email}</p>
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium capitalize">
                {user?.role || "user"}
              </div>
              {user?.userType && user.userType !== "regularUser" && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                  {user.userType.replace(/([A-Z])/g, " $1").trim()}
                </div>
              )}
            </div>
            <div className="mt-6 p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="text-emerald-600" size={24} />
                <span className="text-2xl font-bold text-emerald-600">
                  {user?.totalPoints || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Personal Information</h3>
            {!isEditing && (
              <Button
                variant="outline"
                icon={Edit2}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
              <Input
                label="Carbon Footprint Goal (kg CO₂e/month)"
                type="number"
                step="0.1"
                value={formData.carbonFootprintGoal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carbonFootprintGoal: parseFloat(e.target.value),
                  })
                }
              />

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium">
                    {user?.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Department</label>
                  <p className="font-medium">
                    {user?.department || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">User Type</label>
                  <p className="font-medium capitalize">{user?.userType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Institution</label>
                  <p className="font-medium">
                    {user?.institutionId?.name || "None"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Monthly Goal</label>
                  <p className="font-medium">
                    {user?.carbonFootprintGoal
                      ? `${user.carbonFootprintGoal} kg CO₂e`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Join Institution */}
      {!user?.institutionId?._id && user?.role === "user" && (
        <Card>
          <h3 className="text-xl font-bold mb-2">Join an Institution</h3>
          <p className="text-gray-600 mb-4">
            Enter the institution code provided by your admin to send a join
            request.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              label="Institution Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <Input
              label="Message (optional)"
              value={joinMsg}
              onChange={(e) => setJoinMsg(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                onClick={handleJoinByCode}
                loading={joinLoading}
                className="w-full"
              >
                Request to Join
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-2 border-red-200">
        <h3 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-semibold">Delete Account</p>
              <p className="text-sm text-gray-600">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
