import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Activity, BarChart3, Award } from "lucide-react";
import { Button, Card } from "../components/ui";
import api from "../api/client";

const LandingPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ users: 0, activities: 0, emissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.metrics.getPublic();
        setMetrics(res.data);
      } catch (_) {
        // leave defaults on failure
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50">
      {/* Hero Section */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf size={32} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">CarbonNet</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>Get Started</Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Track Your Carbon Footprint,
            <br />
            Make a Difference
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Measure, monitor, and reduce your carbon emissions with our
            intelligent platform. Join institutions and individuals making a
            real impact on climate change.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" icon={Leaf} onClick={() => navigate("/register")}>
              Start Tracking Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              const el = document.getElementById('features');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-16">
          <Card hover>
            <Activity size={32} className="text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Activity Tracking</h3>
            <p className="text-gray-600">
              Log your daily activities and automatically calculate emissions
              using verified standards.
            </p>
          </Card>
          <Card hover>
            <BarChart3 size={32} className="text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">
              Understand your impact with beautiful charts and insights tailored
              to your habits.
            </p>
          </Card>
          <Card hover>
            <Award size={32} className="text-amber-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Gamification</h3>
            <p className="text-gray-600">
              Compete in challenges, earn points, and climb the leaderboard
              while reducing emissions.
            </p>
          </Card>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-8">
            Join Our Growing Community
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <p className="text-4xl font-bold text-emerald-600">{loading ? '—' : metrics.users.toLocaleString()}</p>
              <p className="text-gray-600">Registered Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-emerald-600">{loading ? '—' : metrics.activities.toLocaleString()}</p>
              <p className="text-gray-600">Activities Logged</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-emerald-600">{loading ? '—' : `${metrics.emissions.toLocaleString()} kg`}</p>
              <p className="text-gray-600">Cumulative CO₂e</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-emerald-600">Live</p>
              <p className="text-gray-600">Data-backed</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2025 CarbonNet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
