import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Card, Button, Input } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      await api.auth.forgotPassword(email);
      success("Password reset link sent! Check your email.");
      setSubmitted(true);
    } catch (err) {
      error(err.message || "Failed to send reset link. Please try again.");
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
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
          <p className="text-gray-600 mt-2">
            {submitted
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        <Card>
          {submitted ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Email Sent!
              </h3>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>
              <div className="space-y-3">
                <Link to="/login">
                  <Button className="w-full" icon={ArrowLeft}>
                    Back to Login
                  </Button>
                </Link>
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                placeholder="your@email.com"
                required
              />

              <div className="space-y-3">
                <Button type="submit" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>

                <Link to="/login">
                  <Button variant="ghost" className="w-full" icon={ArrowLeft}>
                    Back to Login
                  </Button>
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

export default ForgotPasswordPage;
