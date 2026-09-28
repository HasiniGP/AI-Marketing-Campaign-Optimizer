const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

// ==================================================
// GEMINI MODELS
// ==================================================

// Use current stable models.
// The first model is the primary model.
// The others are fallbacks if the first one fails.
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ==================================================
// GEMINI SETUP
// ==================================================

console.log("====================================");
console.log("AI Marketing Campaign Optimizer");
console.log("====================================");

if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing from .env");
} else {
  console.log("Gemini API key loaded successfully.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==================================================
// MONGODB SETUP
// ==================================================

let mongoConnected = false;

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

// ==================================================
// CONNECT MONGODB
// ==================================================

async function connectMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI is missing from .env");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    mongoConnected = true;

    console.log("MongoDB connected successfully.");
  } catch (error) {
    mongoConnected = false;

    console.error("MongoDB connection failed.");
    console.error(error.message);
  }
}

// ==================================================
// BASIC ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.send("AI Marketing Campaign Optimizer Backend is running!");
});

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    mongodbConfigured: !!process.env.MONGODB_URI,
    mongodbConnected: mongoConnected,
  });
});

// ==================================================
// WAIT HELPER
// ==================================================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================================================
// TEMPORARY ERROR CHECK
// ==================================================

function isTemporaryError(error) {
  const status = error?.status;
  const message = error?.message || String(error);

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

// ==================================================
// GEMINI RESPONSE TEXT HELPER
// ==================================================

function getResponseText(response) {
  try {
    if (typeof response?.text === "string") {
      return response.text;
    }

    if (typeof response?.text === "function") {
      return response.text();
    }

    return "";
  } catch (error) {
    console.error("Could not read Gemini response text.");
    return "";
  }
}

// ==================================================
// CLEAN JSON FROM GEMINI
// ==================================================

function cleanJsonText(text) {
  if (!text) return "";

  let cleaned = String(text).trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Sometimes Gemini may return text before/after JSON.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

// ==================================================
// GEMINI FALLBACK
// ==================================================

async function generateWithFallback(prompt) {
  let lastError = null;

  for (const model of MODELS) {
    console.log("------------------------------------");
    console.log(`Trying Gemini model: ${model}`);
    console.log("------------------------------------");

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.55,
        },
      });

      const responseText = getResponseText(response);

      if (!responseText) {
        throw new Error(
          `Gemini returned an empty response from ${model}`
        );
      }

      console.log(`SUCCESS: ${model}`);

      return response;
    } catch (error) {
      lastError = error;

      const status = error?.status;
      const message = error?.message || String(error);

      console.error(`FAILED: ${model}`);
      console.error(message);

      // ------------------------------------------
      // QUOTA ERROR
      // ------------------------------------------

      if (
        status === 429 ||
        /RESOURCE_EXHAUSTED|quota|exceeded your current quota/i.test(
          message
        )
      ) {
        console.log("Quota unavailable.");
        console.log("Trying next Gemini model...");
        continue;
      }

      // ------------------------------------------
      // MODEL NOT FOUND / INVALID MODEL
      // ------------------------------------------

      if (
        status === 400 ||
        status === 404 ||
        /not found|not_found|invalid.*model|model.*not found/i.test(
          message
        )
      ) {
        console.log("Model unavailable.");
        console.log("Trying next Gemini model...");
        continue;
      }

      // ------------------------------------------
      // TEMPORARY ERROR
      // ------------------------------------------

      if (isTemporaryError(error)) {
        console.log("Temporary Gemini error.");
        console.log("Retrying once...");

        await wait(2000);

        try {
          const retryResponse =
            await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                temperature: 0.55,
              },
            });

          const retryText =
            getResponseText(retryResponse);

          if (!retryText) {
            throw new Error(
              `Gemini returned an empty response on retry from ${model}`
            );
          }

          console.log(`SUCCESS ON RETRY: ${model}`);

          return retryResponse;
        } catch (retryError) {
          lastError = retryError;

          console.error("Retry failed.");
          console.error(
            retryError?.message ||
              String(retryError)
          );

          continue;
        }
      }

      // ------------------------------------------
      // ANY OTHER ERROR
      // ------------------------------------------

      console.log(
        "Gemini request failed. Trying next model..."
      );

      continue;
    }
  }

  throw (
    lastError ||
    new Error("All Gemini models failed.")
  );
}

// ==================================================
// CAMPAIGN OPTIMIZER
// ==================================================

app.post("/api/campaign", async (req, res) => {
  console.log("");
  console.log("====================================");
  console.log("CAMPAIGN REQUEST RECEIVED");
  console.log("====================================");

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
      additionalDetails || details || "";

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!product || !budget || !goal) {
      return res.status(400).json({
        error: "Missing required campaign information",
        message:
          "Product, budget and campaign goal are required.",
      });
    }

    const numericBudget = Number(budget);

    if (
      Number.isNaN(numericBudget) ||
      numericBudget <= 0
    ) {
      return res.status(400).json({
        error: "Invalid budget",
        message:
          "Please enter a valid campaign budget.",
      });
    }

    const selectedPlatforms = Array.isArray(platforms)
      ? platforms.filter(Boolean)
      : [];

    if (selectedPlatforms.length === 0) {
      return res.status(400).json({
        error: "No platform selected",
        message:
          "Please select at least one marketing platform.",
      });
    }

    const platformText =
      selectedPlatforms.join(", ");

    // ==================================================
    // DYNAMIC AI PROMPT
    // ==================================================

    const prompt = `
You are an expert digital marketing strategist,
advertising creative director and campaign optimizer.

Your job is to analyze the user's ACTUAL product or service
and create a complete marketing campaign specifically for it.

IMPORTANT:

The product can be ANYTHING.

It could be:
- a physical product
- a digital product
- a mobile app
- a software product
- a service
- a restaurant
- a local business
- an educational service
- a fitness service
- clothing
- electronics
- food
- beauty
- skincare
- jewellery
- furniture
- travel
- or any other legitimate product or service.

NEVER assume that the user's product is a smartwatch,
ice cream, cosmetic, food item, clothing item,
electronic item or any other fixed category.

First understand the actual product/service.

Then build the campaign around THAT product/service.

==================================================
CAMPAIGN INFORMATION
==================================================

Product / Service:
${product}

Campaign Budget:
₹${numericBudget}

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

==================================================
MARKETING RULES
==================================================

1. Analyze the actual product/service provided by the user.

2. Do NOT use examples from this prompt as the actual product.

3. Create ad content specifically for the user's product/service.

4. The advertisement must sound natural and realistic.

5. The headline must be relevant to the actual product/service.

6. The description must explain the actual product/service.

7. Benefits must be relevant to the actual product/service.

8. CTA must suit the product and campaign goal.

9. Do not mention AI inside the actual advertisement copy.

10. Do not invent unrealistic technical specifications.

11. Do not claim medical, financial or guaranteed results.

12. If the product is clothing, consider style,
    comfort, fabric, fit, occasion and appearance.

13. If the product is food, consider taste,
    quality, ingredients, convenience and experience.

14. If the product is beauty/skincare, use appropriate
    cosmetic language without unsupported medical claims.

15. If the product is electronics, consider useful features,
    convenience, design and user experience.

16. If the product is a service, create a service-focused
    advertisement instead of pretending it is a physical product.

17. If the category is unclear, create a professional
    general product/service advertisement.

18. Use ONLY the platforms selected by the user.

19. Budget allocation must total exactly 100%.

20. If only one platform is selected, give it 100%.

21. Predicted ROI, conversions and revenue are estimates.

22. Never guarantee marketing results.

==================================================
AD CREATIVE
==================================================

Create a realistic advertisement concept for the
actual product/service.

Generate:

- headline
- short description
- exactly 3 relevant benefits
- CTA
- visual style
- product category
- visual direction
- ad format

The visual direction must be based on the actual
product/service.

Do not blindly copy example categories.

==================================================
CAMPAIGN STRATEGY
==================================================

Also determine:

- predicted ROI
- estimated conversions
- estimated revenue
- confidence level
- platform budget allocation
- best advertising time
- campaign duration
- target audience
- overall marketing recommendation

The numbers are estimates and should be reasonable
for the provided budget, product/service and goal.

==================================================
RETURN ONLY VALID JSON
==================================================

Return exactly this structure:

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

  "audience": "Detailed recommended target audience",

  "recommendation": "Detailed overall marketing strategy",

  "adHeadline": "Product-specific advertising headline",

  "adDescription": "Short product-specific advertising description",

  "adBenefits": [
    "Relevant benefit 1",
    "Relevant benefit 2",
    "Relevant benefit 3"
  ],

  "cta": "SHOP NOW",

  "productCategory": "Actual product/service category",

  "visualStyle": "Professional visual style appropriate for the actual product/service",

  "visualDirection": "Detailed description of how the actual product/service should visually appear in the advertisement",

  "adFormat": "Sponsored Product Ad"
}

==================================================
IMPORTANT JSON RULES
==================================================

- Return ONLY JSON.
- No Markdown.
- No code fences.
- No explanation before JSON.
- No explanation after JSON.
- Use the exact selected platforms.
- Budget percentages must total exactly 100%.
- adHeadline must relate to the actual product/service.
- adDescription must relate to the actual product/service.
- adBenefits must contain exactly 3 relevant benefits.
- productCategory must describe the actual product/service.
- visualStyle must suit the actual product/service.
- visualDirection must describe the actual product/service.
`;


    // ==================================================
    // CALL GEMINI
    // ==================================================

    console.log("Sending campaign to Gemini...");

    const response =
      await generateWithFallback(prompt);

    const responseText =
      getResponseText(response);

    console.log("");
    console.log("====================================");
    console.log("GEMINI RESPONSE");
    console.log("====================================");

    console.log(responseText);

    // ==================================================
    // PARSE JSON
    // ==================================================

    let result;

    try {
      const cleanedText =
        cleanJsonText(responseText);

      result = JSON.parse(cleanedText);
    } catch (error) {
      console.error(
        "Gemini returned invalid JSON."
      );

      console.error(
        "Raw response:",
        responseText
      );

      return res.status(500).json({
        error: "Invalid AI response",
        message:
          "Gemini returned a response that could not be parsed.",
      });
    }

    // ==================================================
    // VALIDATE MAIN RESULT
    // ==================================================

    if (
      !result ||
      !result.predictedROI ||
      result.conversions === undefined ||
      !result.revenue ||
      !result.confidence ||
      !result.budgetAllocation ||
      !result.bestTime ||
      !result.duration ||
      !result.audience ||
      !result.recommendation
    ) {
      console.error(
        "Gemini returned incomplete campaign information."
      );

      return res.status(500).json({
        error: "Incomplete AI response",
        message:
          "Gemini returned incomplete campaign information.",
      });
    }

    // ==================================================
    // ENSURE AD DATA EXISTS
    // ==================================================

    if (!result.adHeadline) {
      result.adHeadline =
        `Discover ${product}`;
    }

    if (!result.adDescription) {
      result.adDescription =
        `Discover ${product} designed to meet your needs.`;
    }

    if (
      !Array.isArray(result.adBenefits) ||
      result.adBenefits.length < 3
    ) {
      result.adBenefits = [
        "Quality product or service",
        "Designed around customer needs",
        "A practical choice for the target audience",
      ];
    }

    // Always keep exactly 3 benefits.
    result.adBenefits =
      result.adBenefits.slice(0, 3);

    if (!result.cta) {
      if (
        String(goal).toLowerCase().includes("awareness")
      ) {
        result.cta = "LEARN MORE";
      } else if (
        String(goal).toLowerCase().includes("lead")
      ) {
        result.cta = "GET STARTED";
      } else {
        result.cta = "SHOP NOW";
      }
    }

    if (!result.productCategory) {
      result.productCategory = "Product / Service";
    }

    if (!result.visualStyle) {
      result.visualStyle =
        "Clean modern product-focused visual";
    }

    if (!result.visualDirection) {
      result.visualDirection =
        `Create a professional advertisement featuring ${product} prominently with a clean, relevant background and product-focused composition.`;
    }

    if (!result.adFormat) {
      result.adFormat =
        "Sponsored Product Ad";
    }

    // ==================================================
    // NORMALIZE BUDGET ALLOCATION
    // ==================================================

    function getPercentage(value) {
      const number = parseFloat(
        String(value)
          .replace("%", "")
          .trim()
      );

      return Number.isFinite(number)
        ? number
        : null;
    }

    const cleanedAllocation = {};

    let validAllocation = true;

    selectedPlatforms.forEach((platform) => {
      if (
        result.budgetAllocation &&
        result.budgetAllocation[platform] !== undefined
      ) {
        const value =
          getPercentage(
            result.budgetAllocation[platform]
          );

        if (
          value !== null &&
          value >= 0
        ) {
          cleanedAllocation[platform] =
            value;
        } else {
          validAllocation = false;
        }
      } else {
        validAllocation = false;
      }
    });

    const allocationTotal =
      Object.values(cleanedAllocation).reduce(
        (sum, value) => sum + value,
        0
      );

    // If Gemini did not provide correct allocation,
    // create our own exact 100% allocation.
    if (
      !validAllocation ||
      Object.keys(cleanedAllocation).length !==
        selectedPlatforms.length ||
      Math.abs(allocationTotal - 100) > 0.01
    ) {
      console.log(
        "Normalizing budget allocation..."
      );

      const count =
        selectedPlatforms.length;

      const base =
        Math.floor(100 / count);

      const remainder =
        100 - base * count;

      selectedPlatforms.forEach(
        (platform, index) => {
          const percentage =
            base +
            (index < remainder ? 1 : 0);

          cleanedAllocation[platform] =
            `${percentage}%`;
        }
      );
    } else {
      selectedPlatforms.forEach(
        (platform) => {
          cleanedAllocation[platform] =
            `${cleanedAllocation[platform]}%`;
        }
      );
    }

    result.budgetAllocation =
      cleanedAllocation;

    // ==================================================
    // SAVE CAMPAIGN TO MONGODB
    // ==================================================

    if (mongoConnected) {
      try {
        const savedCampaign =
          await Campaign.create({
            product,
            budget: numericBudget,
            goal,
            location: location || "",
            interests: interests || "",
            age: age || "",
            gender: gender || "All",
            platforms: selectedPlatforms,
            additionalDetails:
              campaignDetails,
            aiResult: result,
          });

        console.log(
          "Campaign saved successfully."
        );

        console.log(
          "MongoDB ID:",
          savedCampaign._id.toString()
        );
      } catch (databaseError) {
        console.error(
          "Campaign could not be saved to MongoDB."
        );

        console.error(
          databaseError.message
        );
      }
    } else {
      console.log(
        "MongoDB is not connected. Campaign was not saved."
      );
    }

    // ==================================================
    // SEND RESULT TO FRONTEND
    // ==================================================

    console.log("");
    console.log("====================================");
    console.log("AI CAMPAIGN RESULT READY");
    console.log("====================================");

    res.json(result);
  } catch (error) {
    console.error("");
    console.error("====================================");
    console.error("AI OPTIMIZATION ERROR");
    console.error("====================================");

    console.error(
      error?.message || error
    );

    res.status(500).json({
      error: "AI optimization failed",
      message:
        error?.message ||
        "Something went wrong while generating the campaign.",
    });
  }
});

// ==================================================
// GET ALL CAMPAIGNS
// ==================================================

app.get("/api/campaigns", async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }

    const campaigns =
      await Campaign.find()
        .sort({ createdAt: -1 })
        .lean();

    const formattedCampaigns =
      campaigns.map((campaign) => ({
        id: campaign._id.toString(),

        product: campaign.product,

        budget: campaign.budget,

        goal: campaign.goal,

        location: campaign.location,

        interests: campaign.interests,

        age: campaign.age,

        gender: campaign.gender,

        platforms: campaign.platforms,

        additionalDetails:
          campaign.additionalDetails,

        result: campaign.aiResult,

        createdAt:
          campaign.createdAt,
      }));

    res.json(formattedCampaigns);
  } catch (error) {
    console.error(
      "Error loading campaigns:"
    );

    console.error(error);

    res.status(500).json({
      error: "Failed to load campaigns",
      message: error.message,
    });
  }
});

// ==================================================
// DELETE CAMPAIGN
// ==================================================

app.delete(
  "/api/campaigns/:id",
  async (req, res) => {
    try {
      if (!mongoConnected) {
        return res.status(503).json({
          error: "MongoDB not connected",
        });
      }

      await Campaign.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Campaign deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete campaign error:",
        error
      );

      res.status(500).json({
        error: "Failed to delete campaign",
        message: error.message,
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================

async function startServer() {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log("");
    console.log("====================================");
    console.log(
      `Backend server running on http://localhost:${PORT}`
    );
    console.log("====================================");
  });
}

startServer();