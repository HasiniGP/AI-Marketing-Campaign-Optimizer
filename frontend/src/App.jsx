import { useEffect, useMemo, useState } from "react";
import {
  FiHome,
  FiPlus,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiChevronDown,
  FiUsers,
  FiTarget,
  FiFileText,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiZap,
  FiMapPin,
  FiHeart,
  FiBriefcase,
  FiDownload,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiCalendar,
  FiSliders,
  FiShield,
  FiMoon,
  FiSun,
  FiMail,
  FiLock,
  FiTrash2,
  FiPieChart,
  FiEye,
  FiMousePointer,
  FiPercent,
} from "react-icons/fi";

import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa";
import { SiGoogleads } from "react-icons/si";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-marketing-campaign-optimizer.onrender.com";

const PLATFORM_COLORS = {
  Instagram: "#e84393",
  "Google Ads": "#4285f4",
  YouTube: "#ff4757",
  Facebook: "#1877f2",
  LinkedIn: "#0a66c2",
};

const PLATFORM_ICONS = {
  Instagram: <FaInstagram />,
  "Google Ads": <SiGoogleads />,
  YouTube: <FaYoutube />,
  Facebook: <FaFacebook />,
  LinkedIn: <FaLinkedin />,
};

const PLATFORM_TIPS = {
  Instagram: [
    "Reels & Story Ads",
    "Influencer collaboration",
    "Engaging visual content",
    "Hashtag campaigns",
  ],
  "Google Ads": [
    "Search & Display Ads",
    "Targeted keywords",
    "High-intent audience",
    "Landing-page optimization",
  ],
  YouTube: [
    "Short video ads",
    "Product demonstrations",
    "Skippable ads",
    "Creator-style reviews",
  ],
  Facebook: [
    "Carousel ads",
    "Retargeting campaigns",
    "Audience segmentation",
    "Engaging ad copy",
  ],
  LinkedIn: [
    "Sponsored content",
    "Professional audience",
    "Brand credibility",
    "Educational content",
  ],
};

const normalizeCampaign = (c) => ({
  id: c._id || c.id,
  createdAt: c.createdAt,
  product: c.product || "",
  budget: Number(c.budget || 0),
  location: c.location || "",
  interests: c.interests || "",
  age: c.age || "",
  gender: c.gender || "All",
  goal: c.goal || "Sales",
  platforms: Array.isArray(c.platforms) ? c.platforms : [],
  result: c.aiResult || c.result || {},
});

function App() {
  const [product, setProduct] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("All");
  const [goal, setGoal] = useState("");
  const [platforms, setPlatforms] = useState([
    "Instagram",
    "Facebook",
    "Google Ads",
    "YouTube",
    "LinkedIn",
  ]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState("strategy");
  const [activePage, setActivePage] = useState("Create Campaign");
  const [campaigns, setCampaigns] = useState([]);
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aiMarketingSettings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("aiMarketingSettings", JSON.stringify(settings));
  }, [settings]);

  const currency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getROI = (item) =>
    parseFloat(
      String(item?.result?.predictedROI || "0").replace(/[^0-9.]/g, "")
    ) || 0;

  const getRevenue = (item) =>
    Number(
      String(item?.result?.revenue || "0").replace(/[^0-9.]/g, "")
    ) || 0;

  const totalBudget = campaigns.reduce(
    (sum, c) => sum + Number(c.budget || 0),
    0
  );
  const totalConversions = campaigns.reduce(
    (sum, c) => sum + (Number(c.result?.conversions) || 0),
    0
  );
  const totalRevenue = campaigns.reduce(
    (sum, c) => sum + getRevenue(c),
    0
  );
  const averageROI = campaigns.length
    ? campaigns.reduce((sum, c) => sum + getROI(c), 0) / campaigns.length
    : 0;

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load campaigns");
      }
      setCampaigns(
        Array.isArray(data) ? data.map(normalizeCampaign) : []
      );
    } catch (error) {
      console.error("Campaign history error:", error);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const togglePlatform = (platform) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };

  const resetForm = () => {
    setProduct("");
    setBudget("");
    setLocation("");
    setInterests("");
    setAge("");
    setGender("All");
    setGoal("");
    setAdditionalDetails("");
    setPlatforms([
      "Instagram",
      "Facebook",
      "Google Ads",
      "YouTube",
      "LinkedIn",
    ]);
    setResult(null);
    setResultTab("strategy");
  };

  const optimizeCampaign = async () => {
    if (!product.trim()) {
      alert("Please describe your Product / Service.");
      return;
    }

    if (!budget) {
      alert("Please enter your campaign budget.");
      return;
    }

    if (platforms.length === 0) {
      alert("Please select at least one marketing platform.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          budget,
          goal: goal || "Sales",
          location,
          interests,
          age,
          gender,
          platforms,
          additionalDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI optimization failed");
      }

      setResult(data);
      setResultTab("strategy");
      await loadCampaigns();
    } catch (error) {
      console.error("Optimization error:", error);
      alert(
        error.message ||
          "AI optimization could not be completed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openSavedCampaign = (campaign) => {
    setProduct(campaign.product || "");
    setBudget(String(campaign.budget || ""));
    setLocation(campaign.location || "");
    setInterests(campaign.interests || "");
    setAge(campaign.age || "");
    setGender(campaign.gender || "All");
    setGoal(campaign.goal || "Sales");
    setPlatforms(campaign.platforms || []);
    setResult(campaign.result || null);
    setResultTab("strategy");
    setActivePage("Create Campaign");
  };

  const allocation = result?.budgetAllocation || {};
  const allocationEntries = Object.entries(allocation);

  const donutStyle = useMemo(() => {
    let start = 0;
    const stops = allocationEntries.map(([platform, raw]) => {
      const value = parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
      const end = start + value;
      const color = PLATFORM_COLORS[platform] || "#7c3aed";
      const stop = `${color} ${start}% ${end}%`;
      start = end;
      return stop;
    });

    return {
      background: stops.length
        ? `conic-gradient(${stops.join(", ")})`
        : "conic-gradient(#e9e7f4 0 100%)",
    };
  }, [allocationEntries]);

  const pieRows = allocationEntries.map(([platform, raw]) => {
    const percentage =
      parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
    return {
      platform,
      percentage,
      amount: (Number(budget || 0) * percentage) / 100,
    };
  });

  const renderCampaignForm = () => (
    <>
      <div className="breadcrumb">
        <span>Dashboard</span>
        <span>›</span>
        <strong>Create Campaign</strong>
      </div>

      <div className="page-heading">
        <div>
          <h1>Create New Campaign</h1>
          <p>
            Provide your campaign details and let AI optimize for maximum
            results
          </p>
        </div>
      </div>

      <div className="create-layout">
        <div className="form-card">
          <section className="form-section">
            <div className="step-number">1</div>
            <div className="section-content">
              <h2>Describe Your Product or Service <em>*</em></h2>
              <p className="section-description">
                Tell us what you want to promote.
              </p>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                maxLength={500}
                placeholder="Tell us what you want to promote..."
              />
              <div className="field-note">
                Example: Skincare serum for oily skin, eco-friendly water
                bottle, online coding course, etc.
                <span>{product.length}/500</span>
              </div>
            </div>
          </section>

          <section className="form-section compact-section">
            <div className="step-number">2</div>
            <div className="section-content">
              <h2>Total Budget (₹) <em>*</em></h2>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter your total budget"
              />
              <div className="field-note">
                Example: 5000, 10000, 50000
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="step-number">3</div>
            <div className="section-content">
              <h2>Select Marketing Platforms <em>*</em></h2>
              <p className="section-description">
                Choose where you want to run your campaign.
              </p>

              <div className="platform-grid">
                {Object.keys(PLATFORM_ICONS).map((platform) => (
                  <button
                    type="button"
                    key={platform}
                    className={`platform-card ${
                      platforms.includes(platform)
                        ? "platform-selected"
                        : ""
                    }`}
                    onClick={() => togglePlatform(platform)}
                  >
                    <span className="platform-icon">
                      {PLATFORM_ICONS[platform]}
                    </span>
                    <span>{platform}</span>
                    <span className="platform-check">
                      {platforms.includes(platform) ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="step-number">4</div>
            <div className="section-content">
              <h2>Target Audience</h2>
              <p className="section-description">
                Help AI understand the customers you want to reach.
              </p>

              <div className="audience-grid">
                <div className="input-group">
                  <label>Age Range</label>
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 18 - 35"
                  />
                </div>

                <div className="input-group">
                  <label>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Location</label>
                  <div className="input-with-icon">
                    <FiMapPin />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, India"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Interests</label>
                  <input
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. skincare, beauty, fitness, technology"
                  />
                </div>

              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="step-number">5</div>
            <div className="section-content">
              <h2>Campaign Goal <em>*</em></h2>
              <p className="section-description">
                What do you want to achieve?
              </p>

              <div className="goal-grid">
                {[
                  ["Brand Awareness", "Increase brand visibility", FiTarget],
                  ["Lead Generation", "Generate quality leads", FiUsers],
                  ["Sales", "Drive sales and revenue", FiTrendingUp],
                  ["Website Traffic", "Increase website visits", FiBarChart2],
                ].map(([name, desc, Icon]) => (
                  <button
                    type="button"
                    key={name}
                    className={`goal-card ${
                      goal === name ? "goal-selected" : ""
                    }`}
                    onClick={() => setGoal(name)}
                  >
                    <Icon />
                    <span>
                      <strong>{name}</strong>
                      <small>{desc}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="step-number">6</div>
            <div className="section-content">
              <h2>
                Additional Details <span>(Optional)</span>
              </h2>
              <p className="section-description">
                Add any special instructions, key messages, offers, or
                brand preferences.
              </p>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                maxLength={500}
                placeholder="Example: Highlight our summer offer, focus on eco-friendly benefits..."
              />
              <div className="field-note">
                <span>{additionalDetails.length}/500</span>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button className="reset-button" onClick={resetForm}>
              Reset
            </button>
            <button
              className="primary-button"
              onClick={optimizeCampaign}
              disabled={loading}
            >
              <FiZap />
              {loading ? "AI is analyzing..." : "Optimize Campaign with AI"}
              <span>→</span>
            </button>
          </div>
        </div>

        <aside className="create-side">
          <div className="mini-card">
            <div className="mini-card-title">
              <FiFileText />
              <h2>Campaign Summary</h2>
            </div>

            <div className="summary-row">
              <span>Product / Service</span>
              <strong>{product || "Not specified"}</strong>
            </div>
            <div className="summary-row">
              <span>Total Budget</span>
              <strong>{budget ? currency(budget) : "Not specified"}</strong>
            </div>
            <div className="summary-row">
              <span>Platforms</span>
              <div className="summary-platforms">
                {platforms.map((platform) => (
                  <span key={platform}>{PLATFORM_ICONS[platform]}</span>
                ))}
              </div>
            </div>
            <div className="summary-row">
              <span>Audience</span>
              <strong>
                {age || "Any age"} · {gender}
              </strong>
            </div>
            <div className="summary-row">
              <span>Location</span>
              <strong>{location || "Not specified"}</strong>
            </div>
            <div className="summary-row">
              <span>Goal</span>
              <strong>{goal || "Not selected"}</strong>
            </div>
          </div>

          <div className="ai-preview">
            <div className="ai-preview-title">
              <FiZap />
              <div>
                <h2>AI Optimization</h2>
                <span>Ready to analyze</span>
              </div>
            </div>
            <p>
              AI will use your campaign inputs to recommend budget,
              audience, timing, platform strategy, ad ideas and predicted
              performance.
            </p>
            <div className="check-list">
              <span><FiCheckCircle /> Budget allocation</span>
              <span><FiCheckCircle /> Audience strategy</span>
              <span><FiCheckCircle /> Ad recommendations</span>
              <span><FiCheckCircle /> ROI prediction</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  const renderResults = () => (
    <>
      <div className="breadcrumb">
        <span>Dashboard</span>
        <span>›</span>
        <span>Campaigns</span>
        <span>›</span>
        <strong>Results</strong>
      </div>

      <div className="results-heading">
        <div>
          <h1>AI Optimization Results</h1>
          <p>
            Your AI-optimized marketing strategy based on your campaign
            inputs.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => window.print()}>
            <FiDownload /> Download Report
          </button>
          <button
            className="primary-small"
            onClick={() => {
              setResult(null);
              setActivePage("Create Campaign");
            }}
          >
            <FiRefreshCw /> New Campaign
          </button>
        </div>
      </div>

      <div className="result-top-grid">
        <div className="result-overview card">
          <div className="card-title">
            <h2>Campaign Overview</h2>
            <span className="completed-badge">Completed</span>
          </div>
          <div className="overview-content">
            <div className="overview-icon"><FiZap /></div>
            <div>
              <h3>{product || "Marketing Campaign"}</h3>
              <p>
                {goal || "Sales"} campaign
                {location ? ` targeting ${location}` : ""}.
              </p>
              <div className="tag-row">
                <span>{goal || "Sales"}</span>
                <span>{age || "All ages"}</span>
                <span>{gender}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="budget-allocation card">
          <div className="card-title">
            <h2>Budget Allocation</h2>
            <FiPieChart />
          </div>
          <div className="budget-visual">
            <div className="donut" style={donutStyle}>
              <div className="donut-hole">
                <strong>{currency(budget)}</strong>
                <span>Total Budget</span>
              </div>
            </div>

            <div className="allocation-list">
              {pieRows.map((item) => (
                <div className="allocation-row" key={item.platform}>
                  <div className="allocation-name">
                    <i
                      style={{
                        background:
                          PLATFORM_COLORS[item.platform] || "#7c3aed",
                      }}
                    />
                    <span className="allocation-platform-icon">
                      {PLATFORM_ICONS[item.platform]}
                    </span>
                    <strong>{item.platform}</strong>
                  </div>
                  <div className="allocation-values">
                    <b>{item.percentage}%</b>
                    <span>{currency(item.amount)}</span>
                  </div>
                </div>
              ))}
              {!pieRows.length && (
                <p className="empty-note">
                  AI budget allocation will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-card card">
        <div className="card-title">
          <h2>Key Estimates (Predicted)</h2>
        </div>
        <div className="metric-grid">
          <div className="metric-card green">
            <FiTrendingUp />
            <div><strong>{result?.predictedROI || "—"}</strong><span>Estimated ROI</span></div>
          </div>
          <div className="metric-card blue">
            <FiUsers />
            <div><strong>{result?.reach || "120K"}</strong><span>Estimated Reach</span></div>
          </div>
          <div className="metric-card pink">
            <FiMousePointer />
            <div><strong>{result?.cpc || "₹20"}</strong><span>Estimated CPC</span></div>
          </div>
          <div className="metric-card orange">
            <FiPercent />
            <div><strong>{result?.ctr || "4.5%"}</strong><span>Estimated CTR</span></div>
          </div>
        </div>
      </div>

      <div className="strategy-card card">
        <div className="card-title">
          <h2>AI Optimized Campaign Plan</h2>
        </div>

        <div className="strategy-tabs">
          {[
            ["strategy", "Strategy Plan"],
            ["content", "Content Ideas"],
            ["platform", "Platform Strategy"],
            ["timeline", "Timeline"],
          ].map(([key, label]) => <button key={key} className={resultTab === key ? "active" : ""} onClick={() => setResultTab(key)}>{label}</button>)}
        </div>

        {resultTab === "strategy" && <div className="strategy-overview">
          <div className="strategy-icon"><FiTarget /></div>
          <div><h3>Campaign Strategy</h3><p>{result?.recommendation || "Use a focused multi-platform strategy based on your selected audience, campaign goal and available budget."}</p></div>
        </div>}

        {resultTab === "content" && <div className="tab-content-panel">
          <h3>Content Ideas</h3><div className="content-idea-grid">
            {[(result?.contentIdeas || ["Short product demo Reel", "Before-and-after style post", "Customer testimonial", "Limited-time offer"] )].flat().map((idea, i) => <div key={i}><FiCheckCircle /><span>{typeof idea === "string" ? idea : JSON.stringify(idea)}</span></div>)}
          </div>
        </div>}

        {resultTab === "platform" && <div className="tab-content-panel">
          <h3>Platform Strategy</h3><div className="platform-recommendations">
            {pieRows.map((item) => <div className="platform-recommendation" key={item.platform}><div className="platform-rec-header"><span className="platform-rec-icon">{PLATFORM_ICONS[item.platform]}</span><div><strong>{item.platform}</strong><span>{item.percentage}% Budget</span></div></div><ul>{(PLATFORM_TIPS[item.platform] || ["Relevant ad content","Audience targeting","Performance testing"]).map((tip) => <li key={tip}><FiCheckCircle /> {tip}</li>)}</ul></div>)}
          </div>
        </div>}

        {resultTab === "timeline" && <div className="tab-content-panel">
          <h3>Campaign Timeline</h3><div className="timeline-list">
            <div><b>Week 1</b><span>Launch, test creatives and collect early engagement signals.</span></div>
            <div><b>Week 2</b><span>Review AI estimates and refine audience/platform messaging.</span></div>
            <div><b>Week 3</b><span>Scale the strongest-performing content and budget allocation.</span></div>
            <div><b>Final Week</b><span>Evaluate conversions, ROI and prepare the next campaign cycle.</span></div>
          </div><div className="timeline-duration"><FiClock /><strong>Recommended duration: {result?.duration || "14 days"}</strong></div>
        </div>}

        <div className="result-recommendation">
          <FiZap /><div><strong>AI Recommendation</strong><p>{result?.recommendation || "Review the recommendations and focus spend on the strongest audience-platform combinations."}</p></div>
        </div>
      </div>

      <div className="result-info card">
        <div className="card-title">
          <h2>Campaign Information</h2>
        </div>
        <div className="info-grid">
          <div><span>Product / Service</span><strong>{product}</strong></div>
          <div><span>Budget</span><strong>{currency(budget)}</strong></div>
          <div><span>Campaign Goal</span><strong>{goal || "Sales"}</strong></div>
          <div><span>Location</span><strong>{location || "Not specified"}</strong></div>
          <div><span>Age Range</span><strong>{age || "Not specified"}</strong></div>
          <div><span>Gender</span><strong>{gender}</strong></div>
        </div>
        <button className="secondary-button" onClick={() => setResult(null)}>
          ← Edit Campaign
        </button>
      </div>
    </>
  );

  const renderDashboard = () => (
    <>
      <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Overview</strong></div>
      <div className="page-heading"><h1>Dashboard</h1><p>Monitor your AI-powered marketing campaigns and performance.</p></div>

      <div className="kpi-grid four">
        <div className="kpi-card"><FiFileText /><span>Total Campaigns</span><strong>{campaigns.length}</strong></div>
        <div className="kpi-card"><FiDollarSign /><span>Total Budget</span><strong>{currency(totalBudget)}</strong></div>
        <div className="kpi-card"><FiTrendingUp /><span>Average ROI</span><strong>{averageROI ? `${averageROI.toFixed(1)}x` : "—"}</strong></div>
        <div className="kpi-card"><FiUsers /><span>Predicted Conversions</span><strong>{totalConversions || "—"}</strong></div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title"><div><h2>Recent Campaigns</h2><p>Latest AI optimized campaigns</p></div><button className="text-button" onClick={() => setActivePage("Campaigns")}>View all</button></div>
          {campaigns.length ? campaigns.slice(0, 5).map((c) => (
            <div className="campaign-row" key={c.id}>
              <div><strong>{c.product || "Untitled Campaign"}</strong><span>{c.goal} · {currency(c.budget)}</span></div>
              <button className="secondary-button small" onClick={() => openSavedCampaign(c)}>View Results</button>
            </div>
          )) : <div className="empty-state">Create your first campaign to populate the dashboard.</div>}
        </div>
        <div className="card quick-card">
          <div className="card-title"><h2>Quick Actions</h2></div>
          {[
            ["Create Campaign", "Start a new AI campaign", FiPlus],
            ["Analytics", "Review campaign analytics", FiBarChart2],
            ["AI Recommendations", "View strategy recommendations", FiZap],
          ].map(([name, desc, Icon]) => (
            <button key={name} className="quick-action" onClick={() => setActivePage(name)}>
              <Icon /><span><strong>{name}</strong><small>{desc}</small></span><b>→</b>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderCampaigns = () => (
    <>
      <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Campaigns</strong></div>
      <div className="page-heading">
        <div><h1>Campaigns</h1><p>View and manage your saved AI campaigns.</p></div>
        <button className="primary-small" onClick={() => { setResult(null); setActivePage("Create Campaign"); }}><FiPlus /> New Campaign</button>
      </div>
      <div className="card campaign-history">
        <div className="history-header"><h2>Campaign History ({campaigns.length})</h2><span>Saved in MongoDB Atlas</span></div>
        {campaigns.length ? campaigns.map((c) => (
          <div className="history-row" key={c.id}>
            <div className="history-main">
              <div className="history-icon"><FiZap /></div>
              <div>
                <strong>{c.product}</strong>
                <span>{c.goal} · {c.platforms.join(", ")} · {currency(c.budget)}</span>
              </div>
            </div>
            <button className="secondary-button small" onClick={() => openSavedCampaign(c)}>View Results</button>
          </div>
        )) : <div className="empty-state">No saved campaigns yet.</div>}
      </div>
    </>
  );

  const platformCounts = useMemo(() => {
    const counts = {};
    campaigns.forEach((campaign) => {
      (campaign.platforms || []).forEach((platform) => {
        counts[platform] = (counts[platform] || 0) + 1;
      });
    });
    return counts;
  }, [campaigns]);

  const renderAnalytics = () => {
    const campaignRows = campaigns.slice(0, 6);
    const maxRevenue = Math.max(...campaignRows.map((c) => getRevenue(c)), 1);
    const uniquePlatforms = Object.keys(platformCounts);
    const platformShares = uniquePlatforms.map((platform) => ({
      platform,
      count: platformCounts[platform],
      share: campaigns.length ? Math.round((platformCounts[platform] / campaigns.length) * 100) : 0,
    }));

    return (
      <>
        <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Analytics</strong></div>
        <div className="page-heading analytics-heading">
          <div><h1>Analytics</h1><p>Performance estimates from your saved AI campaign results.</p></div>
          <button className="filter-button"><FiCalendar /> Last 30 Days <FiChevronDown /></button>
        </div>

        <div className="analytics-kpis">
          <div className="analytics-kpi purple"><FiFileText /><span>Campaigns</span><strong>{campaigns.length}</strong><small>Saved campaigns</small></div>
          <div className="analytics-kpi pink"><FiDollarSign /><span>Total Budget</span><strong>{currency(totalBudget)}</strong><small>Across all campaigns</small></div>
          <div className="analytics-kpi green"><FiTrendingUp /><span>Average ROI</span><strong>{averageROI ? `${averageROI.toFixed(2)}x` : "—"}</strong><small>AI estimated</small></div>
          <div className="analytics-kpi blue"><FiUsers /><span>Conversions</span><strong>{totalConversions || "—"}</strong><small>Total predicted</small></div>
          <div className="analytics-kpi orange"><FiTarget /><span>Estimated Revenue</span><strong>{currency(totalRevenue)}</strong><small>Total estimated revenue</small></div>
          <div className="analytics-kpi violet"><FiBarChart2 /><span>Platforms Used</span><strong>{uniquePlatforms.length || "—"}</strong><small>{uniquePlatforms.join(", ") || "No platforms yet"}</small></div>
        </div>

        <div className="analytics-main-grid">
          <div className="card analytics-panel campaign-performance-panel">
            <div className="analytics-panel-title"><div><h2>Campaign Performance</h2><p>Budget, ROI and conversions for each campaign</p></div><div className="chart-legend"><span><i className="legend-budget" /> Budget (₹)</span><span><i className="legend-revenue" /> Estimated Revenue (₹)</span><span><i className="legend-roi" /> ROI (x)</span></div></div>
            <div className="campaign-chart">
              <div className="chart-y-label">Amount (₹)</div>
              <div className="campaign-chart-area">
                <div className="chart-grid-lines"><i/><i/><i/><i/><i/></div>
                <div className="campaign-bars">
                  {campaignRows.map((c) => {
                    const revenue = getRevenue(c);
                    const budgetValue = Number(c.budget || 0);
                    const roi = getROI(c);
                    return <div className="campaign-bar-group" key={c.id}>
                      <div className="campaign-bar-pair"><span className="campaign-bar budget" style={{height:`${Math.max(8,(budgetValue/Math.max(totalBudget,1))*100)}%`}} title={`Budget ${currency(budgetValue)}`} /><span className="campaign-bar revenue" style={{height:`${Math.max(8,(revenue/maxRevenue)*100)}%`}} title={`Estimated Revenue ${currency(revenue)}`} /></div>
                      <b>{roi ? `${roi}x` : "—"}</b><small>{(c.product || "Campaign").slice(0,14)}</small>
                    </div>;
                  })}
                  {!campaignRows.length && <div className="empty-state">Create a campaign to see analytics.</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="card analytics-panel platform-usage-panel">
            <div className="analytics-panel-title"><div><h2>Platform Usage</h2><p>Distribution of campaigns across platforms</p></div><FiPieChart /></div>
            <div className="platform-donut-wrap">
              <div className="platform-donut" style={{background: platformShares.length ? `conic-gradient(${platformShares.map((x,i)=>`${PLATFORM_COLORS[x.platform] || ["#7138e8","#b69af7","#f19ab9"][i%3]} ${platformShares.slice(0,i).reduce((a,y)=>a+y.share,0)}% ${platformShares.slice(0,i+1).reduce((a,y)=>a+y.share,0)}%`).join(", ")})` : "conic-gradient(#e8e4f4 0 100%)"}}>
                <div><strong>{campaigns.length}</strong><span>Campaigns</span></div>
              </div>
              <div className="platform-usage-legend">
                {platformShares.map((item) => <div key={item.platform}><span className="platform-usage-name"><i style={{background:PLATFORM_COLORS[item.platform] || "#7138e8"}} />{PLATFORM_ICONS[item.platform]}<strong>{item.platform}</strong></span><b>{item.share}%</b><small>{item.count} campaigns</small></div>)}
                {!platformShares.length && <div className="empty-state">No platform data yet.</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-bottom-grid">
          <div className="card analytics-panel revenue-panel">
            <div className="analytics-panel-title"><div><h2>Budget vs Estimated Revenue</h2><p>Comparison of total budget and estimated revenue for each campaign</p></div></div>
            <div className="revenue-chart">
              {campaignRows.map((c) => { const b=Number(c.budget||0); const r=getRevenue(c); return <div className="revenue-group" key={c.id}><div className="revenue-bars"><span className="revenue-budget" style={{height:`${Math.max(8,(b/Math.max(...campaignRows.map(x=>Number(x.budget||0)),1))*100)}%`}} /><span className="revenue-estimate" style={{height:`${Math.max(8,(r/Math.max(...campaignRows.map(x=>getRevenue(x)),1))*100)}%`}} /></div><b>{currency(b).replace("₹","₹")}</b><small>{(c.product||"Campaign").slice(0,12)}</small></div>; })}
              {!campaignRows.length && <div className="empty-state">No saved campaign data yet.</div>}
            </div>
            <div className="chart-legend bottom"><span><i className="legend-budget"/> Total Budget</span><span><i className="legend-revenue"/> Estimated Revenue</span></div>
          </div>

          <div className="card analytics-panel insights-panel">
            <div className="analytics-panel-title"><div><h2>AI Performance Insights</h2><p>Key insights from your campaign data</p></div><FiZap /></div>
            <div className="ai-insight-item green"><FiTrendingUp /><div><strong>Average ROI {averageROI ? `${averageROI.toFixed(2)}x` : "—"}</strong><span>AI estimate based on saved campaign results.</span></div></div>
            <div className="ai-insight-item purple"><FaInstagram /><div><strong>Instagram usage</strong><span>{platformCounts.Instagram || 0} saved campaign{(platformCounts.Instagram || 0) === 1 ? "" : "s"} use Instagram.</span></div></div>
            <div className="ai-insight-item blue"><FiBarChart2 /><div><strong>Estimated revenue vs budget</strong><span>{totalRevenue ? `${currency(totalRevenue)} estimated revenue from ${currency(totalBudget)} total budget.` : "Create campaigns to generate this insight."}</span></div></div>
            <div className="ai-insight-item orange"><FiUsers /><div><strong>Conversion potential</strong><span>{totalConversions ? `${totalConversions.toLocaleString("en-IN")} predicted conversions across saved campaigns.` : "Predicted conversion insights will appear here."}</span></div></div>
          </div>
        </div>

        <div className="analytics-disclaimer"><FiShield /><span><strong>AI metrics are estimates.</strong> Actual advertising results require real platform data integration.</span></div>
      </>
    );
  };

  const latestResult = campaigns[0]?.result;

  const renderAIRecommendations = () => {
    const current = campaigns[0] || {};
    const ai = latestResult || {};
    const selectedPlatforms = current.platforms?.length ? current.platforms : platforms;
    const audienceText = ai.audience || `${current.age || age || "18–35"} · ${current.gender || gender || "All"} · ${current.location || location || "Selected location"}`;
    const caption = ai.adCaption || `Make ${current.product || product || "your product"} part of your everyday routine. Discover the difference today. ✨`;
    const recommendation = ai.fallback ? `Focus on ${selectedPlatforms.slice(0, 2).join(" & ")} with engaging visual content tailored to your selected audience. Use short-form videos, clear product benefits, and a strong call-to-action to improve reach and conversions.` : ai.recommendation || `Focus on ${selectedPlatforms.slice(0, 2).join(" & ")} with visual content tailored to your selected audience.`;
    const bestTime = ai.bestTime || "6 PM – 10 PM";
    const adProduct = current.product || product || "Your Product";

    return (
      <>
        <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>AI Recommendations</strong></div>
        <div className="page-heading ai-recommendation-heading"><div><h1>AI Recommendations</h1><p>Get personalized marketing recommendations based on your product, audience and goals.</p></div></div>

        <div className="ai-recommendation-stack">
          <section className="ai-rec-section">
            <div className="ai-rec-number">1</div><div className="ai-rec-title"><FiTarget /><h2>Top Recommendation</h2></div>
            <div className="top-rec-card">
              <div className="top-rec-visual"><div className="mock-product"><span>{adProduct.slice(0,1).toUpperCase()}</span></div><div className="mock-leaf leaf-one"/><div className="mock-leaf leaf-two"/></div>
              <div className="top-rec-copy"><h3>{recommendation.split(".")[0] || "Focus on your strongest platform combination"}</h3><p>{recommendation}</p><div className="rec-tags"><span>↗ High Reach</span><span>₹ Cost Efficient</span><span>✓ Better Conversions</span></div></div>
            </div>
          </section>

          <section className="ai-rec-section">
            <div className="ai-rec-number">2</div><div className="ai-rec-title"><FiClock /><h2>Best Time to Launch</h2></div>
            <div className="launch-grid">
              <div><span>Best Day</span><strong>Tuesday – Thursday</strong><small>Higher engagement window</small></div>
              <div><span>Best Time</span><strong>{bestTime}</strong><small>Most active online users</small></div>
              <div><span>Best Season</span><strong>Peak campaign season</strong><small>Based on AI audience analysis</small></div>
            </div>
          </section>

          <section className="ai-rec-section">
            <div className="ai-rec-number">3</div><div className="ai-rec-title"><FiUsers /><h2>Recommended Audiences</h2></div>
            <div className="recommended-audience-card">
              <div><FiUsers /><span>Primary Audience</span><strong>{audienceText}</strong></div>
              <div><FiMapPin /><span>Location</span><strong>{current.location || location || "Selected location"}</strong></div>
              <div><FiHeart /><span>Interests</span><strong>{current.interests || interests || "Relevant interests"}</strong></div>
            </div>
          </section>

          <section className="ai-rec-section">
            <div className="ai-rec-number">4</div><div className="ai-rec-title"><FiFileText /><h2>Caption Recommendation</h2></div>
            <div className="caption-card"><span>Suggested caption</span><p>{caption}</p><div className="caption-meta"><span>CTA: Shop Now</span><span>Format: Short video / Reel</span><span>Platform: {selectedPlatforms[0] || "Instagram"}</span></div></div>
          </section>

          <section className="ai-rec-section">
            <div className="ai-rec-number">5</div>
            <div className="ai-rec-title"><FiFileText /><h2>Sample Ad Created by AI</h2></div>
            {(() => {
              const productText = String(adProduct).toLowerCase();
              const adType = /watch|smartwatch|wearable/.test(productText)
                ? "watch"
                : /earbud|headphone|airpod|speaker/.test(productText)
                ? "audio"
                : /serum|skincare|cream|cosmetic|beauty|lipstick|makeup/.test(productText)
                ? "beauty"
                : /rice|food|snack|chocolate|coffee|tea|honey|juice|drink/.test(productText)
                ? "food"
                : "generic";
              const headline = ai.adHeadline || (adType === "watch" ? "Stay connected. Stay ahead." : adType === "audio" ? "Sound that moves with you." : adType === "beauty" ? "Feel confident in your skin." : adType === "food" ? "Good taste. Better everyday choices." : `Discover ${adProduct} differently.`);
              const description = ai.adDescription || (adType === "watch" ? "Track your day, stay active and keep everything within reach." : adType === "audio" ? "Powerful sound, comfortable design and an experience made for everyday listening." : adType === "beauty" ? "A simple everyday choice designed to fit beautifully into your routine." : adType === "food" ? "A delicious everyday choice made for people who care about quality and taste." : `A smarter way to experience ${adProduct}, designed around your everyday needs.`);
              const cta = ai.cta || (current.goal === "Sales" ? "BUY NOW" : "SHOP NOW");
              return (
                <div className={`sample-ad-layout ad-type-${adType}`}>
                  <div className="sample-ad-preview">
                    <div className="sample-ad-platform">
                      <span>{PLATFORM_ICONS[selectedPlatforms[0] || "Instagram"]}</span>
                      <strong>{selectedPlatforms[0] || "Instagram"}</strong>
                      <small>Sponsored</small>
                    </div>

                    <div className="sample-ad-main">
                      <div className="sample-ad-copy">
                        <span className="sample-ad-label">AI GENERATED AD</span>
                        <h3>{adProduct}</h3>
                        <h4>{headline}</h4>
                        <p>{description}</p>
                        <div className="sample-ad-benefits">
                          <span>✓ Quality</span><span>✓ Easy to use</span><span>✓ Made for you</span>
                        </div>
                        <button className="sample-ad-cta">{cta} <b>→</b></button>
                      </div>

                      <div className="sample-ad-product-visual">
                        <div className="product-glow" />
                        {adType === "watch" && (
                          <div className="product-watch">
                            <div className="watch-strap top" /><div className="watch-strap bottom" />
                            <div className="watch-face"><span>{new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span><small>HEALTH</small></div>
                          </div>
                        )}
                        {adType === "audio" && (
                          <div className="product-audio"><div className="earbud left" /><div className="earbud right" /><div className="audio-case"><span>{adProduct.slice(0,1).toUpperCase()}</span></div></div>
                        )}
                        {adType === "beauty" && (
                          <div className="product-beauty"><div className="beauty-cap" /><div className="beauty-bottle"><span>{adProduct.slice(0,10)}</span></div></div>
                        )}
                        {adType === "food" && (
                          <div className="product-food"><div className="food-pack"><small>PREMIUM</small><strong>{adProduct}</strong><span>GOODNESS</span></div></div>
                        )}
                        {adType === "generic" && (
                          <div className="product-generic"><span>{adProduct.slice(0,1).toUpperCase()}</span><strong>{adProduct}</strong></div>
                        )}
                      </div>
                    </div>

                    <div className="sample-ad-footer">
                      <span>{current.location || location || "India"}</span>
                      <span>{current.goal || goal || "Brand Awareness"}</span>
                      <span>AI Optimized</span>
                    </div>
                  </div>

                  <div className="sample-ad-details">
                    <h3>Ad Details</h3>
                    <div><span>Platform</span><strong>{selectedPlatforms[0] || "Instagram"}</strong></div>
                    <div><span>Objective</span><strong>{current.goal || goal || "Brand Awareness"}</strong></div>
                    <div><span>Format</span><strong>Sponsored Product Ad</strong></div>
                    <div><span>Creative</span><strong>Modern Product Showcase</strong></div>
                    <div><span>CTA</span><strong>{cta}</strong></div>
                    <div className="sample-ad-caption-detail"><span>Ad Copy</span><strong>{caption}</strong></div>
                  </div>
                </div>
              );
            })()}
          </section>
        </div>
      </>
    );
  };

  const renderBudgetOptimizer = () => (
    <>
      <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Budget Optimizer</strong></div>
      <div className="page-heading"><div><h1>Budget Optimizer</h1><p>See how AI distributes your campaign budget across platforms.</p></div><button className="filter-button"><FiSliders /> Latest Campaign</button></div>

      <div className="budget-page-grid">
        <div className="card budget-input-card">
          <div className="card-title"><h2>Campaign Details</h2></div>
          <div className="detail-list">
            <div><span>Product / Service</span><strong>{campaigns[0]?.product || "Create a campaign first"}</strong></div>
            <div><span>Total Budget</span><strong>{campaigns[0] ? currency(campaigns[0].budget) : "—"}</strong></div>
            <div><span>Campaign Goal</span><strong>{campaigns[0]?.goal || "—"}</strong></div>
            <div><span>Platforms</span><strong>{campaigns[0]?.platforms?.length || 0}</strong></div>
          </div>
          <button className="primary-button" onClick={() => setActivePage("Create Campaign")}><FiZap /> Optimize Another Budget</button>
        </div>

        <div className="card budget-main-card">
          <div className="card-title"><div><h2>Recommended Budget Allocation</h2><p>AI-optimized split of the selected campaign budget.</p></div></div>
          {campaigns[0] ? (
            <div className="budget-page-content">
              <div className="donut large" style={{
                background: Object.keys(campaigns[0].result?.budgetAllocation || {}).length
                  ? (() => {
                    let start = 0;
                    const stops = Object.entries(campaigns[0].result?.budgetAllocation || {}).map(([p, raw]) => {
                      const v = parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
                      const end = start + v;
                      const stop = `${PLATFORM_COLORS[p] || "#7c3aed"} ${start}% ${end}%`;
                      start = end;
                      return stop;
                    });
                    return `conic-gradient(${stops.join(", ")})`;
                  })()
                  : "conic-gradient(#eee 0 100%)"
              }}>
                <div className="donut-hole"><strong>{currency(campaigns[0].budget)}</strong><span>Total Budget</span></div>
              </div>
              <div className="allocation-list">
                {Object.entries(campaigns[0].result?.budgetAllocation || {}).map(([platform, raw]) => {
                  const percentage = parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
                  return <div className="allocation-row" key={platform}><div className="allocation-name"><i style={{background: PLATFORM_COLORS[platform] || "#7c3aed"}} /><span className="allocation-platform-icon">{PLATFORM_ICONS[platform]}</span><strong>{platform}</strong></div><div className="allocation-values"><b>{percentage}%</b><span>{currency(campaigns[0].budget * percentage / 100)}</span></div></div>;
                })}
              </div>
            </div>
          ) : <div className="empty-state">Create a campaign to see the AI budget allocation.</div>}
        </div>
      </div>
    </>
  );

  const renderAdPerformance = () => {
    const totalImpressions = campaigns.length ? Math.round(totalBudget * 7.6) : 0;
    const totalClicks = campaigns.length ? Math.round(totalImpressions * 0.045) : 0;
    const ctr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "—";
    const adRows = campaigns.slice(0, 5).map((c, i) => {
      const impressions = Math.round(Number(c.budget || 0) * 7.6);
      const clicks = Math.round(impressions * 0.045);
      return { c, impressions, clicks, conversions: Number(c.result?.conversions || 0), ctr: "4.5%", cost: Number(c.budget || 0) };
    });
    return (
      <>
        <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Ad Performance</strong></div>
        <div className="page-heading"><div><h1>Ad Performance</h1><p>Track AI-estimated performance of your campaign ads across platforms.</p></div><button className="filter-button"><FiCalendar /> Last 30 Days <FiChevronDown /></button></div>
        <div className="analytics-estimate-note"><FiShield /> AI estimates only — real impressions, clicks and conversions require advertising-platform integrations.</div>

        <div className="performance-kpis">
          <div><FiEye /><span>Total Impressions</span><strong>{totalImpressions ? `${(totalImpressions/1000000).toFixed(1)}M` : "—"}</strong><small>AI estimate</small></div>
          <div><FiMousePointer /><span>Total Clicks</span><strong>{totalClicks ? totalClicks.toLocaleString("en-IN") : "—"}</strong><small>AI estimate</small></div>
          <div><FiTarget /><span>Total Conversions</span><strong>{totalConversions || "—"}</strong><small>Predicted</small></div>
          <div><FiPercent /><span>CTR</span><strong>{ctr === "—" ? "—" : `${ctr}%`}</strong><small>Estimated</small></div>
        </div>

        <div className="performance-grid-top">
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Performance by Platform</h2><p>Estimated impressions</p></div></div><div className="platform-bars">{["Instagram","Google Ads","YouTube","Facebook","LinkedIn"].map((p,i)=>{const share=platformCounts[p]||0; const val=campaigns.length ? Math.max(4,Math.round((share/Math.max(campaigns.length,1))*100)) : 0; return <div key={p}><strong>{val}%</strong><span style={{height:`${Math.max(8,val*2.4)}px`,background:PLATFORM_COLORS[p]}}>{PLATFORM_ICONS[p]}</span><small>{p}</small></div>})}</div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Conversion Rate</h2><p>AI-estimated weekly trend</p></div></div><div className="fake-line-chart"><div className="fake-line"/><span className="chart-bubble">4.5%</span><div className="fake-line-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div></div></div>
        </div>

        <div className="performance-grid-bottom">
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Ad Spend vs. Conversions</h2><p>Estimated spend compared with predicted conversions</p></div></div><div className="spend-chart">{["Instagram","Google Ads","YouTube","Facebook","LinkedIn"].map((p,i)=>{const base=campaigns.length ? Math.max(10,Math.round((platformCounts[p]||0)/Math.max(campaigns.length,1)*40)) : 0; return <div key={p}><div><span style={{height:`${base*2}px`}}/><span style={{height:`${Math.max(10,base*1.4)}px`}}/></div><small>{p}</small></div>})}</div><div className="chart-legend bottom"><span><i className="legend-budget"/> Ad Spend (₹)</span><span><i className="legend-revenue"/> Conversions</span></div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Device Performance</h2><p>Estimated click distribution</p></div></div><div className="device-performance"><div className="device-donut"><div><strong>{totalClicks ? totalClicks.toLocaleString("en-IN") : "—"}</strong><span>Total Clicks</span></div></div><div className="device-legend"><span><i style={{background:"#7138e8"}}/> Mobile <b>72%</b></span><span><i style={{background:"#6ba4ff"}}/> Desktop <b>24%</b></span><span><i style={{background:"#c8b5f7"}}/> Tablet <b>4%</b></span></div></div></div>
        </div>

        <div className="card top-ads-card"><div className="analytics-panel-title"><div><h2>Top Performing Ads</h2><p>AI-estimated ad-level performance</p></div><button className="secondary-button small">View All</button></div><div className="table-wrap"><table><thead><tr><th>Ad</th><th>Platform</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Conversions</th><th>Cost (₹)</th></tr></thead><tbody>{adRows.map((row,i)=>{const p=row.c.platforms?.[i % Math.max(row.c.platforms?.length||1,1)] || row.c.platforms?.[0] || "Instagram"; return <tr key={row.c.id}><td>{row.c.product || `Campaign Ad ${i+1}`}</td><td><span className="table-platform-icon">{PLATFORM_ICONS[p]}</span>{p}</td><td>{row.impressions.toLocaleString("en-IN")}</td><td>{row.clicks.toLocaleString("en-IN")}</td><td>{row.ctr}</td><td>{row.conversions || "—"}</td><td>{currency(row.cost)}</td></tr>})}</tbody></table>{!adRows.length && <div className="empty-state">Create a campaign to see AI-estimated ad performance.</div>}</div></div>
      </>
    );
  };

  const renderAudienceInsights = () => {
    const current = campaigns[0] || {};
    const totalAudience = campaigns.length ? Math.max(1000, Math.round(totalBudget * 7.6)) : 0;
    const locationList = [...new Set(campaigns.map(c=>c.location).filter(Boolean))];
    const interestList = [...new Set(campaigns.flatMap(c=>(c.interests||"").split(",").map(x=>x.trim()).filter(Boolean)))];
    const ageLabel = current.age || age || "18–24";
    return (
      <>
        <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Audience Insights</strong></div>
        <div className="page-heading"><div><h1>Audience Insights</h1><p>Understand your target audience and their behavior using AI-generated campaign insights.</p></div><button className="filter-button"><FiCalendar /> Last 30 Days <FiChevronDown /></button></div>
        <div className="analytics-estimate-note"><FiShield /> Audience figures are AI estimates derived from your campaign inputs, not real advertising-platform audience data.</div>

        <div className="audience-kpis">
          <div><FiUsers /><span>Total Audience</span><strong>{totalAudience ? `${(totalAudience/1000000).toFixed(1)}M` : "—"}</strong><small>Estimated reach</small></div>
          <div><FiHeart /><span>Engagement Rate</span><strong>{campaigns.length ? "5.8%" : "—"}</strong><small>AI estimate</small></div>
          <div><FiUsers /><span>Most Active Age Group</span><strong>{ageLabel}</strong><small>Based on campaign targeting</small></div>
          <div><FiMapPin /><span>Top Location</span><strong>{current.location || locationList[0] || location || "—"}</strong><small>Selected/estimated</small></div>
        </div>

        <div className="audience-grid-layout">
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Age Group Distribution</h2><p>AI-estimated audience distribution</p></div></div><div className="age-distribution-chart">{[["13–17",8],["18–24",35],["25–34",28],["35–44",18],["45+",11]].map(([label,value])=><div key={label}><strong>{value}%</strong><span style={{height:`${value*4.2}px`}} className={label.replace("–","")===ageLabel.replace("–","")?"selected-age":""}/><small>{label}</small></div>)}</div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Gender Distribution</h2><p>AI-estimated audience mix</p></div></div><div className="gender-layout"><div className="gender-donut"><div><strong>100%</strong><span>Audience</span></div></div><div className="gender-legend"><span><i style={{background:"#f08bc7"}}/> Female <b>62%</b></span><span><i style={{background:"#5d9af5"}}/> Male <b>36%</b></span><span><i style={{background:"#c6b6f3"}}/> Other <b>2%</b></span></div></div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Top Locations</h2><p>Locations linked to your campaign targeting</p></div></div><div className="rank-list">{(locationList.length?locationList:["Bengaluru","Chennai","Hyderabad","Pune","Mumbai","Other"]).slice(0,6).map((loc,i)=><div key={loc}><span>{loc}</span><div><i style={{width:`${Math.max(15,38-i*6)}%`}}/></div><b>{Math.max(7,38-i*6)}%</b></div>)}</div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Audience Interests</h2><p>Topics the audience is likely to respond to</p></div></div><div className="rank-list interest-rank">{(interestList.length?interestList:["Skincare","Beauty","Fitness","Fashion","Technology","Self-care"]).slice(0,6).map((interest,i)=><div key={interest}><span>{interest}</span><div><i style={{width:`${68-i*8}%`}}/></div><b>{68-i*8}%</b></div>)}</div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Device Usage</h2><p>Expected device distribution</p></div></div><div className="device-performance audience-device"><div className="device-donut audience"><div><strong>{totalAudience ? `${(totalAudience/1000).toFixed(0)}K` : "—"}</strong><span>Users</span></div></div><div className="device-legend"><span><i style={{background:"#7138e8"}}/> Mobile <b>72%</b></span><span><i style={{background:"#6ba4ff"}}/> Desktop <b>24%</b></span><span><i style={{background:"#c8b5f7"}}/> Tablet <b>4%</b></span></div></div></div>
          <div className="card analytics-panel"><div className="analytics-panel-title"><div><h2>Online Activity (Peak Hours)</h2><p>Estimated audience activity throughout the day</p></div></div><div className="activity-chart">{[3,2,4,5,7,10,8,9,12,15,18,7].map((v,i)=><span key={i} style={{height:`${v*7}px`}}/>)}<div className="peak-label">Peak<br/><strong>6 PM – 9 PM</strong></div><div className="activity-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div></div></div>
        </div>
      </>
    );
  };

  const renderReports = () => (
    <>
      <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Reports</strong></div>
      <div className="page-heading"><div><h1>Reports</h1><p>Generate and download detailed campaign performance reports.</p></div><button className="primary-small" onClick={() => window.print()}><FiDownload /> Generate Report</button></div>

      <div className="report-tabs"><button className="active">Campaign Report</button><button>Platform Report</button><button>Audience Report</button><button>ROI Report</button></div>

      <div className="kpi-grid four">
        <div className="kpi-card"><FiFileText /><span>Total Campaigns</span><strong>{campaigns.length}</strong></div>
        <div className="kpi-card"><FiDollarSign /><span>Total Budget</span><strong>{currency(totalBudget)}</strong></div>
        <div className="kpi-card"><FiTarget /><span>Estimated Revenue</span><strong>{currency(totalRevenue)}</strong></div>
        <div className="kpi-card"><FiTrendingUp /><span>Average ROI</span><strong>{averageROI ? `${averageROI.toFixed(2)}x` : "—"}</strong></div>
      </div>

      <div className="card report-card">
        <div className="card-title"><div><h2>Recent Reports</h2><p>Generated from your campaign data.</p></div><button className="secondary-button" onClick={() => window.print()}><FiDownload /> Download</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Report Name</th><th>Type</th><th>Date Generated</th><th>Actions</th></tr></thead>
            <tbody>
              {[
                ["Campaign Performance Report","Campaign"],
                ["Platform Allocation Report","Platform"],
                ["Audience Insights Report","Audience"],
                ["ROI Summary Report","ROI"],
              ].map(([name,type]) => <tr key={name}><td>{name}</td><td>{type}</td><td>{new Date().toLocaleDateString("en-IN")}</td><td><button className="download-button" onClick={() => window.print()}><FiDownload /> Download</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Settings</strong></div>
      <div className="page-heading"><div><h1>Settings</h1><p>Manage your account and application preferences.</p></div></div>

      <div className="settings-tabs">
        <button className="active"><FiUsers /> Profile</button>
        <button><FiSliders /> Preferences</button>
        <button><FiBell /> Notifications</button>
        <button><FiSun /> Appearance</button>
        <button><FiShield /> API & Integrations</button>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <div className="card-title"><h2>Profile Information</h2></div>
          <label>Full Name<input value={settings.name || "Hasini G P"} onChange={(e) => setSettings({...settings, name:e.target.value})} /></label>
          <label>Email Address<input value={settings.email || ""} onChange={(e) => setSettings({...settings, email:e.target.value})} placeholder="your@email.com" /></label>
          <label>Role<select value={settings.role || "Student"} onChange={(e) => setSettings({...settings, role:e.target.value})}><option>Student</option><option>Administrator</option><option>Marketing User</option></select></label>
          <button className="primary-small"><FiSave /> Save Changes</button>
        </div>

        <div className="card settings-card">
          <div className="card-title"><h2>Account Settings</h2></div>
          {[
            ["Change Password","Update your account password.",FiLock],
            ["Two-Factor Authentication","Add an extra layer of security.",FiShield],
            ["Manage Data","Download or delete your campaign data.",FiFileText],
          ].map(([title,desc,Icon]) => <div className="setting-row" key={title}><Icon /><div><strong>{title}</strong><span>{desc}</span></div><button className="secondary-button small">{title === "Manage Data" ? "Manage" : title === "Two-Factor Authentication" ? "Enable" : "Change"}</button></div>)}
          <div className="danger-zone"><div><strong>Delete Account</strong><span>Permanently remove your account and all data.</span></div><button><FiTrash2 /> Delete Account</button></div>
        </div>
      </div>
    </>
  );

  const menu = [
    ["Dashboard", FiHome],
    ["Create Campaign", FiPlus],
    ["Campaigns", FiFileText],
    ["Analytics", FiBarChart2],
    ["AI Recommendations", FiZap],
    ["Budget Optimizer", FiDollarSign],
    ["Ad Performance", FiTrendingUp],
    ["Audience Insights", FiUsers],
    ["Reports", FiFileText],
    ["Settings", FiSettings],
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><FiZap /></div>
          <div><strong>AI Marketing</strong><span>Campaign Optimizer</span></div>
        </div>
        <nav className="navigation">
          {menu.map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => {
                setActivePage(name);
                if (name === "Create Campaign") setResult(null);
              }}
            >
              <Icon /><span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <FiZap />
          <strong>Turn your ideas into high-performing campaigns with AI.</strong>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-button">☰</button>
          <div className="topbar-right">
            <button className="notification"><FiBell /><span>3</span></button>
            <div className="profile">
              <div className="avatar">H</div>
              <div className="profile-info"><strong>Hasini G P</strong><small>Student</small></div>
              <FiChevronDown />
            </div>
          </div>
        </header>

        <div className="page">
          {activePage === "Dashboard" && renderDashboard()}
          {activePage === "Create Campaign" && (result ? renderResults() : renderCampaignForm())}
          {activePage === "Campaigns" && renderCampaigns()}
          {activePage === "Analytics" && renderAnalytics()}
          {activePage === "AI Recommendations" && renderAIRecommendations()}
          {activePage === "Budget Optimizer" && renderBudgetOptimizer()}
          {activePage === "Ad Performance" && renderAdPerformance()}
          {activePage === "Audience Insights" && renderAudienceInsights()}
          {activePage === "Reports" && renderReports()}
          {activePage === "Settings" && renderSettings()}
        </div>
      </main>
    </div>
  );
}

export default App;
