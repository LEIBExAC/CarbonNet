/**
 * AI-based emission estimator using Google Gemini API
 * Used for categories that don't have predefined emission factors
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

exports.isEnabled = () => {
  const enabled = !!GEMINI_API_KEY;
  if (!enabled) {
    console.log("[AIEstimator] Disabled - GEMINI_API_KEY not set");
  }
  return enabled;
};

/**
 * Estimate emissions using Gemini AI
 * @param {Object} activityData - Activity data including category, description, quantity, etc.
 * @returns {Promise<{total: number, factorUsed: Object, confidence: string}>}
 */
exports.estimateEmissions = async (activityData) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const { category, subcategory, description, quantity, unit } = activityData;

  const prompt = `You are a carbon emissions expert. Estimate the CO2 emissions (in kg CO2e) for the following activity:

Category: ${category || "other"}
${subcategory ? `Activity Type: ${subcategory}` : ""}
Description: ${description || "No description provided"}
Quantity: ${quantity || 1} ${unit || "units"}

Please analyze this activity and provide:
1. Estimated carbon emissions in kg CO2e
2. Brief reasoning for your estimate
3. Confidence level (high/medium/low)

Respond in this exact JSON format:
{
  "emissions": <number in kg CO2e>,
  "reasoning": "<brief explanation>",
  "confidence": "<high|medium|low>"
}`;

  console.log("[AIEstimator] Starting estimation with Gemini API");
  console.log("[AIEstimator] Prompt:", prompt);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[AIEstimator] API error response:", errorBody);
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[AIEstimator] API response received");
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      total: parseFloat(result.emissions) || 0,
      factorUsed: {
        factor: parseFloat(result.emissions) / (quantity || 1),
        source: "AI_ESTIMATE_GEMINI",
        version: new Date().getFullYear().toString(),
        confidence: result.confidence || "medium",
        reasoning: result.reasoning || "AI-generated estimate",
      },
    };
  } catch (error) {
    console.error("AI estimation error:", error.message);

    // Fallback to generic estimate
    const genericFactor = 0.5; // kg CO2e per unit
    return {
      total: (quantity || 1) * genericFactor,
      factorUsed: {
        factor: genericFactor,
        source: "FALLBACK",
        version: new Date().getFullYear().toString(),
        confidence: "low",
        reasoning: "Generic fallback estimate (AI unavailable)",
      },
    };
  }
};

/**
 * Batch estimate emissions for multiple activities
 * @param {Array} activities - Array of activity data objects
 * @returns {Promise<Array>} - Array of emission estimates
 */
exports.batchEstimateEmissions = async (activities) => {
  const results = [];

  for (const activity of activities) {
    try {
      const estimate = await exports.estimateEmissions(activity);
      results.push({
        activity,
        estimate,
        success: true,
      });
    } catch (error) {
      results.push({
        activity,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
};
