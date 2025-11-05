import React from "react";
import { Button, Card } from "../components/ui";
import { useState, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";
import { Award } from "lucide-react";
import api from "../api/client";

const ChallengesPage = () => {
  const { addToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadChallenges();
  }, [activeTab]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "active") {
        response = await api.challenges.getActive();
      } else if (activeTab === "my") {
        response = await api.challenges.getMyChallenges();
      } else {
        response = await api.challenges.getAll({ page: 1, limit: 50 });
      }
      setChallenges(
        response.data.challenges || response.data.items || response.data || []
      );
    } catch (error) {
      addToast("Failed to load challenges", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await api.challenges.join(id);
      addToast("Successfully joined challenge!", "success");
      loadChallenges();
    } catch (error) {
      addToast(error.message || "Failed to join challenge", "error");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
        <p className="text-gray-600 mt-2">
          Compete, earn points, and reduce your carbon footprint
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "all", label: "All Challenges" },
          { id: "active", label: "Active" },
          { id: "my", label: "My Challenges" },
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

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                onJoin={handleJoin}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Award size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No challenges found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChallengeCard = ({ challenge, onJoin }) => {
  const difficultyColors = {
    easy: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <Card hover className="flex flex-col h-full">
      {challenge.featured && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-amber-400 text-white text-xs font-bold rounded-full">
            FEATURED
          </span>
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {challenge.description}
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
            {challenge.type}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs capitalize ${
              difficultyColors[challenge.difficulty]
            }`}
          >
            {challenge.difficulty}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Points:</span>
            <span className="font-bold text-emerald-600">
              {challenge.points}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Participants:</span>
            <span className="font-semibold">
              {challenge.participantCount || 0}
            </span>
          </div>
          {challenge.completionRate !== undefined && (
            <div className="flex justify-between">
              <span>Completion:</span>
              <span className="font-semibold">
                {(challenge.completionRate * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant={challenge.isJoined ? "outline" : "primary"}
          className="w-full"
          onClick={() => !challenge.isJoined && onJoin(challenge._id)}
          disabled={challenge.isJoined}
        >
          {challenge.isJoined ? "Joined" : "Join Challenge"}
        </Button>
      </div>
    </Card>
  );
};

export default ChallengesPage;
