const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

// ==================================================
// MONGODB SETUP
// ==================================================

const MONGODB_URI = process.env.MONGODB_URI;

const campaignSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: true,
    },

    budget: {
      type: Number,
      required: true,
    },

    goal: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    interests: {
      type: String,
      default: "",
    },

    age: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      default: "All",
    },

    platforms: {
      type: [String],
      default: [],
    },

    additionalDetails: {
      type: String,
      default: "",
    },

    aiResult: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

let mongoConnected = false;

// ==================================================
// CONNECT TO MONGODB
// ==================================================

async function connectMongoDB() {
  if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI is missing from .env");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    mongoConnected = true;

    console.log("MongoDB connected successfully.");
  } catch (error) {
    mongoConnected = false;

    console.error("MongoDB connection failed:");
    console.error(error.message);
  }
}

// ==================================================
// GEMINI MODELS
// ==================================================

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());

// ==================================================
// GEMINI SETUP
// ==================================================

console.log("====================================");
console.log("AI Marketing Campaign Optimizer");
console.log("====================================");

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "ERROR: GEMINI_API_KEY is missing from .env"
  );
} else {
  console.log(
    "Gemini API key loaded successfully."
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==================================================
// BASIC ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.send(
    "AI Marketing Campaign Optimizer Backend is running!"
  );
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    geminiConfigured:
      !!process.env.GEMINI_API_KEY,
    mongodbConfigured:
      !!process.env.MONGODB_URI,
    mongodbConnected:
      mongoConnected,
  });
});

// ==================================================
// WAIT HELPER
// ==================================================

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ==================================================
// ERROR CHECKING
// ==================================================

function isTemporaryError(error) {
  const status = error?.status;

  const message =
    error?.message || String(error);

  return (
    status === 408 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /408|500|502|503|504|UNAVAILABLE|timeout|DEADLINE_EXCEEDED/i.test(
      message
    )
  );
}

function isQuotaError(error) {
  const status = error?.status;

  const message =
    error?.message || String(error);

  return (
    status === 429 ||
    /429|RESOURCE_EXHAUSTED|quota|exceeded your current quota/i.test(
      message
    )
  );
}

// ==================================================
// GEMINI MODEL FALLBACK
// ==================================================

async function generateWithFallback(prompt) {
  let lastError = null;

  for (const model of MODELS) {
    console.log("\n------------------------------------");
    console.log(
      `Trying Gemini model: ${model}`
    );
    console.log("------------------------------------");

    try {
      console.log(
        `Sending request to ${model}...`
      );

      const response =
        await ai.models.generateContent({
          model: model,

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",

            temperature: 0.4,
          },
        });

      console.log(
        `SUCCESS: Response received from ${model}`
      );

      return response;
    } catch (error) {
      lastError = error;

      const status = error?.status;

      const message =
        error?.message || String(error);

      console.error(
        `FAILED: ${model}`
      );

      console.error(message);

      // ------------------------------------------
      // QUOTA ERROR
      // ------------------------------------------

      if (isQuotaError(error)) {
        console.log(
          `${model} quota unavailable.`
        );

        console.log(
          "Moving to next Gemini model..."
        );

        continue;
      }

      // ------------------------------------------
      // TEMPORARY SERVER ERROR
      // ------------------------------------------

      if (isTemporaryError(error)) {
        console.log(
          `${model} temporarily unavailable.`
        );

        console.log(
          "Retrying once after 2 seconds..."
        );

        await wait(2000);

        try {
          console.log(
            `Retrying ${model}...`
          );

          const retryResponse =
            await ai.models.generateContent({
              model: model,

              contents: prompt,

              config: {
                responseMimeType:
                  "application/json",

                temperature: 0.4,
              },
            });

          console.log(
            `SUCCESS: Retry worked with ${model}`
          );

          return retryResponse;
        } catch (retryError) {
          lastError = retryError;

          console.error(
            `Retry failed for ${model}.`
          );

          console.error(
            retryError?.message ||
              String(retryError)
          );

          continue;
        }
      }

      // ------------------------------------------
      // OTHER ERROR
      // ------------------------------------------

      console.log(
        `Unexpected error with ${model}.`
      );

      console.log(
        "Moving to next model..."
      );
    }
  }

  throw lastError;
}

// ==================================================
// SAFE FALLBACK RESULT
// ==================================================
//
// This is used only when Gemini is temporarily
// unavailable or the quota is exhausted.
//
// It prevents the campaign submission from failing.
// It is clearly marked as a fallback estimate.
//

function createFallbackResult({
  budget,
  selectedPlatforms,
  goal,
  product,
}) {
  const totalBudget =
    Number(budget) || 0;

  const weights = {
    Instagram: 35,
    "Google Ads": 30,
    YouTube: 20,
    Facebook: 10,
    LinkedIn: 5,
  };

  const allocation = {};

  if (selectedPlatforms.length === 1) {
    allocation[selectedPlatforms[0]] =
      "100%";
  } else {
    let totalWeight = 0;

    selectedPlatforms.forEach(
      (platform) => {
        totalWeight +=
          weights[platform] || 20;
      }
    );

    let assigned = 0;

    selectedPlatforms.forEach(
      (platform, index) => {
        if (
          index ===
          selectedPlatforms.length - 1
        ) {
          allocation[platform] =
            `${100 - assigned}%`;
          return;
        }

        let percentage = Math.round(
          ((weights[platform] || 20) /
            totalWeight) *
            100
        );

        percentage = Math.max(
          1,
          percentage
        );

        allocation[platform] =
          `${percentage}%`;

        assigned += percentage;
      }
    );

    // Make sure allocation is exactly 100%.
    let calculatedTotal = 0;

    Object.values(allocation).forEach(
      (value) => {
        const number =
          parseFloat(
            String(value).replace("%", "")
          );

        if (!Number.isNaN(number)) {
          calculatedTotal += number;
        }
      }
    );

    const lastPlatform =
      selectedPlatforms[
        selectedPlatforms.length - 1
      ];

    const lastValue =
      parseFloat(
        String(
          allocation[lastPlatform]
        ).replace("%", "")
      );

    allocation[lastPlatform] =
      `${lastValue + (100 - calculatedTotal)}%`;
  }

  const predictedROI = 2.5;

  const conversions = Math.max(
    1,
    Math.round(
      totalBudget * 0.008
    )
  );

  const revenue = Math.round(
    totalBudget * predictedROI
  );

  return {
    predictedROI:
      `${predictedROI}x`,

    conversions:
      conversions,

    revenue:
      `₹${revenue.toLocaleString(
        "en-IN"
      )}`,

    confidence:
      "65%",

    budgetAllocation:
      allocation,

    bestTime:
      "6 PM - 10 PM",

    duration:
      "14 days",

    audience:
      `${goal || "Sales"} audience interested in ${
        product ||
        "the selected product/service"
      }.`,

    recommendation:
      "Gemini is temporarily unavailable. " +
      "This campaign uses a fallback estimate " +
      "for demonstration and testing. " +
      "Actual advertising performance may differ.",

    fallback:
      true,
  };
}

// ==================================================
// CAMPAIGN OPTIMIZER
// ==================================================

app.post(
  "/api/campaign",
  async (req, res) => {
    console.log("\n====================================");
    console.log(
      "CAMPAIGN REQUEST RECEIVED"
    );
    console.log(
      "====================================");

    try {
      const {
        product,
        budget,
        goal,
        location,
        interests,
        age,
        gender,
        platforms,
        additionalDetails,
        details,
      } = req.body;

      const campaignDetails =
        additionalDetails ||
        details ||
        "";

      console.log(
        "Product:",
        product
      );

      console.log(
        "Budget:",
        budget
      );

      console.log(
        "Goal:",
        goal
      );

      console.log(
        "Location:",
        location ||
          "Not specified"
      );

      console.log(
        "Age:",
        age ||
          "Not specified"
      );

      console.log(
        "Gender:",
        gender ||
          "Not specified"
      );

      console.log(
        "Interests:",
        interests ||
          "Not specified"
      );

      console.log(
        "Platforms:",
        platforms || []
      );

      console.log(
        "Additional Details:",
        campaignDetails ||
          "Not specified"
      );

      // ------------------------------------------
      // VALIDATION
      // ------------------------------------------

      if (
        !product ||
        !budget ||
        !goal
      ) {
        return res.status(400).json({
          error:
            "Missing required campaign information",

          message:
            "Product, budget and campaign goal are required.",
        });
      }

      const selectedPlatforms =
        Array.isArray(platforms)
          ? platforms
          : [];

      if (
        selectedPlatforms.length === 0
      ) {
        return res.status(400).json({
          error:
            "No platform selected",

          message:
            "Please select at least one marketing platform.",
        });
      }

      const platformText =
        selectedPlatforms.join(", ");

      // ------------------------------------------
      // AI PROMPT
      // ------------------------------------------

      const prompt = `
You are an expert digital marketing campaign optimizer.

Create a professional and practical digital marketing
campaign strategy based on the information below.

CAMPAIGN INFORMATION
====================

Product / Service:
${product}

Campaign Budget:
₹${budget}

Campaign Goal:
${goal}

Target Location:
${location || "Not specified"}

Age Range:
${age || "Not specified"}

Gender:
${gender || "Not specified"}

Customer Interests / Behaviour:
${interests || "Not specified"}

Selected Marketing Platforms:
${platformText}

Additional Campaign Details:
${campaignDetails || "Not specified"}


IMPORTANT RULES
===============

1. Analyze this specific campaign.

2. Use ONLY the marketing platforms selected by the user.

3. Do NOT add platforms that were not selected.

4. Budget allocation must total exactly 100%.

5. If only one platform is selected, give it 100%.

6. If multiple platforms are selected, distribute the budget
   realistically between those selected platforms.

7. Predicted ROI, conversions and revenue are estimates only.

8. Never guarantee marketing results.

9. If audience information is missing, make a reasonable
   marketing assumption.

10. Keep the strategy realistic for the given budget.

11. Return ONLY valid JSON.

12. Do not use Markdown.

13. Do not put JSON inside a code block.

14. Do not add any text before or after the JSON.


RETURN EXACTLY THIS STRUCTURE
============================

{
  "predictedROI": "3.5x",
  "conversions": 120,
  "revenue": "₹90000",
  "confidence": "85%",
  "budgetAllocation": {
    "Instagram": "40%",
    "Google Ads": "35%",
    "LinkedIn": "25%"
  },
  "bestTime": "6 PM - 10 PM",
  "duration": "14 days",
  "audience": "Detailed description of the recommended target audience",
  "recommendation": "Detailed overall marketing strategy"
}

The budgetAllocation example is only an example.

Your actual response MUST contain only the platforms
selected by the user.

The percentages MUST total exactly 100%.
`;

      console.log(
        "\nSending campaign to Gemini AI..."
      );

      // ------------------------------------------
      // GEMINI REQUEST
      // ------------------------------------------

      let response;
      let responseText;

      try {
        response =
          await generateWithFallback(
            prompt
          );

        responseText =
          response.text;
      } catch (geminiError) {
        console.error(
          "\nGemini failed after all available models."
        );

        console.error(
          geminiError?.message ||
            String(geminiError)
        );

        // ----------------------------------------
        // FALLBACK FOR 503 / 429 / TEMPORARY ERRORS
        // ----------------------------------------

        if (
          isTemporaryError(
            geminiError
          ) ||
          isQuotaError(
            geminiError
          )
        ) {
          console.log(
            "Using safe fallback campaign result."
          );

          const fallbackResult =
            createFallbackResult({
              budget,
              selectedPlatforms,
              goal,
              product,
            });

          // --------------------------------------
          // SAVE FALLBACK RESULT
          // --------------------------------------

          if (mongoConnected) {
            try {
              await Campaign.create({
                product,

                budget:
                  Number(budget),

                goal,

                location:
                  location || "",

                interests:
                  interests || "",

                age:
                  age || "",

                gender:
                  gender || "All",

                platforms:
                  selectedPlatforms,

                additionalDetails:
                  campaignDetails,

                aiResult:
                  fallbackResult,
              });

              console.log(
                "Fallback campaign saved to MongoDB successfully."
              );
            } catch (dbError) {
              console.error(
                "Fallback campaign could not be saved to MongoDB:"
              );

              console.error(
                dbError.message
              );
            }
          }

          return res.json(
            fallbackResult
          );
        }

        throw geminiError;
      }

      console.log(
        "\n===================================="
      );

      console.log(
        "GEMINI RESPONSE RECEIVED"
      );

      console.log(
        "===================================="
      );

      console.log(
        responseText
      );

      // ------------------------------------------
      // PARSE RESPONSE
      // ------------------------------------------

      let result;

      try {
        result =
          JSON.parse(
            responseText
          );
      } catch (parseError) {
        console.error(
          "Normal JSON parsing failed."
        );

        try {
          const cleanedText =
            responseText
              .replace(
                /```json/gi,
                ""
              )
              .replace(
                /```/g,
                ""
              )
              .trim();

          result =
            JSON.parse(
              cleanedText
            );
        } catch (secondError) {
          console.error(
            "Gemini returned invalid JSON."
          );

          return res.status(500).json({
            error:
              "Invalid AI response",

            message:
              "Gemini returned a response that could not be parsed.",
          });
        }
      }

      // ------------------------------------------
      // VALIDATE RESULT
      // ------------------------------------------

      if (
        !result.predictedROI ||
        result.conversions ===
          undefined ||
        !result.revenue ||
        !result.confidence ||
        !result.budgetAllocation ||
        !result.bestTime ||
        !result.duration ||
        !result.audience ||
        !result.recommendation
      ) {
        return res.status(500).json({
          error:
            "Incomplete AI response",

          message:
            "Gemini returned incomplete campaign information.",
        });
      }

      // ------------------------------------------
      // CHECK BUDGET ALLOCATION
      // ------------------------------------------

      let totalPercentage = 0;

      for (
        const value of Object.values(
          result.budgetAllocation
        )
      ) {
        const number =
          parseFloat(
            String(value).replace(
              "%",
              ""
            )
          );

        if (
          !Number.isNaN(number)
        ) {
          totalPercentage +=
            number;
        }
      }

      console.log(
        `Budget allocation total: ${totalPercentage}%`
      );

      // ------------------------------------------
      // FINAL RESULT
      // ------------------------------------------

      console.log(
        "\n===================================="
      );

      console.log(
        "AI CAMPAIGN RESULT"
      );

      console.log(
        "===================================="
      );

      console.log(
        result
      );

      // ------------------------------------------
      // SAVE CAMPAIGN TO MONGODB
      // ------------------------------------------

      if (mongoConnected) {
        try {
          await Campaign.create({
            product,

            budget:
              Number(budget),

            goal,

            location:
              location || "",

            interests:
              interests || "",

            age:
              age || "",

            gender:
              gender || "All",

            platforms:
              selectedPlatforms,

            additionalDetails:
              campaignDetails,

            aiResult:
              result,
          });

          console.log(
            "Campaign saved to MongoDB successfully."
          );
        } catch (dbError) {
          console.error(
            "Campaign could not be saved to MongoDB:"
          );

          console.error(
            dbError.message
          );
        }
      }

      return res.json(
        result
      );
    } catch (error) {
      console.error(
        "\n===================================="
      );

      console.error(
        "AI OPTIMIZATION ERROR"
      );

      console.error(
        "===================================="
      );

      console.error(
        error
      );

      return res.status(500).json({
        error:
          "AI optimization failed",

        message:
          error?.message ||
          "Something went wrong while generating the campaign.",
      });
    }
  }
);

// ==================================================
// GET ALL CAMPAIGNS
// ==================================================

app.get(
  "/api/campaigns",
  async (req, res) => {
    if (!mongoConnected) {
      return res.status(503).json({
        error:
          "Database unavailable",

        message:
          "MongoDB is not connected.",
      });
    }

    try {
      const campaigns =
        await Campaign.find()
          .sort({
            createdAt: -1,
          });

      return res.json(
        campaigns
      );
    } catch (error) {
      console.error(
        "Failed to fetch campaigns:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch campaigns",

        message:
          error.message,
      });
    }
  }
);

// ==================================================
// DELETE CAMPAIGN
// ==================================================

app.delete(
  "/api/campaigns/:id",
  async (req, res) => {
    if (!mongoConnected) {
      return res.status(503).json({
        error:
          "Database unavailable",

        message:
          "MongoDB is not connected.",
      });
    }

    try {
      const deleted =
        await Campaign.findByIdAndDelete(
          req.params.id
        );

      if (!deleted) {
        return res.status(404).json({
          error:
            "Campaign not found",
        });
      }

      return res.json({
        message:
          "Campaign deleted successfully",

        id:
          req.params.id,
      });
    } catch (error) {
      console.error(
        "Failed to delete campaign:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to delete campaign",

        message:
          error.message,
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================

connectMongoDB();

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        "\n===================================="
      );

      console.log(
        `Backend server running on http://localhost:${PORT}`
      );

      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );

      console.log(
        "Waiting for campaign requests..."
      );

      console.log(
        "====================================\n"
      );
    }
  );

// ==================================================
// SERVER ERROR
// ==================================================

server.on(
  "error",
  (error) => {
    console.error(
      "SERVER ERROR:"
    );

    if (
      error.code ===
      "EADDRINUSE"
    ) {
      console.error(
        `Port ${PORT} is already being used by another process.`
      );
    } else {
      console.error(
        error
      );
    }
  }
);

// ==================================================
// GLOBAL ERRORS
// ==================================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "UNCAUGHT EXCEPTION:"
    );

    console.error(
      error
    );
  }
);

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "UNHANDLED PROMISE REJECTION:"
    );

    console.error(
      error
    );
  }
);