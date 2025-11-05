import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Leaf, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Card, Button, Input } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: successToast, error } = useToast();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password.length < 8) {
      error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPassword(token, formData.password);
      successToast("Password reset successful!");
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      error(
        err.message || "Failed to reset password. The link may be expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf size={40} className="text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">CarbonNet</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            {success
              ? "Your password has been reset!"
              : "Enter your new password"}
          </p>
        </div>

        <Card>
          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Password Reset Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                You can now login with your new password.
              </p>
              <Link to="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={Lock}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={Lock}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-800">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
