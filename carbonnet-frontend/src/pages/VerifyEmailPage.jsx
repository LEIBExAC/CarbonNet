import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Leaf, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Card, Button } from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const { success: successToast, error: errorToast } = useToast();

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    setStatus("verifying");

    try {
      const response = await api.auth.verifyEmail(token);
      setStatus("success");
      setMessage(response.message || "Email verified successfully!");
      successToast("Email verified! You can now login.");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.message ||
          "Failed to verify email. The link may be invalid or expired."
      );
      errorToast("Email verification failed");
    }
  };

  const handleResendVerification = async () => {
    setResending(true);

    try {
      // This would need the user's email - you might want to add an email input field
      // For now, we'll show a message to go back to login
      successToast(
        "Please login and request a new verification email from your profile"
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      errorToast("Failed to resend verification email");
    } finally {
      setResending(false);
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
          <h2 className="text-2xl font-bold text-gray-800">
            Email Verification
          </h2>
        </div>

        <Card>
          <div className="text-center py-6">
            {status === "verifying" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2
                    size={48}
                    className="text-emerald-600 animate-spin"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Verifying your email...
                </h3>
                <p className="text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Email Verified Successfully!
                </h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting to login page...
                </p>
                <Link to="/login">
                  <Button className="w-full">Go to Login Now</Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle size={32} className="text-red-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    className="w-full"
                    loading={resending}
                    icon={Mail}
                  >
                    Request New Verification Email
                  </Button>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
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

export default VerifyEmailPage;
