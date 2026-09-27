import { useEffect, useState } from "react";
import {
  FiHome,
  FiPlus,
  FiBarChart2,
  FiSettings,
  FiLogOut,
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
} from "react-icons/fi";

import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa";

import { SiGoogleads } from "react-icons/si";

import "./App.css";

function App() {
  // -----------------------------
  // CAMPAIGN INPUTS
  // -----------------------------
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
  const [activePage, setActivePage] = useState("Create Campaign");
  const [campaigns, setCampaigns] = useState([]);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aiMarketingSettings") || "{}"); } catch { return {}; }
  });

  // Load campaigns from MongoDB through the backend.
  const loadCampaigns = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/campaigns");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load campaigns");
      }

      const mongoCampaigns = Array.isArray(data)
        ? data
        : (data.campaigns || []);

      setCampaigns(
        mongoCampaigns.map((campaign) => ({
          ...campaign,
          id: campaign._id || campaign.id,
          createdAt: campaign.createdAt || new Date().toISOString(),
          result: campaign.result || campaign.aiResult || {},
        }))
      );
    } catch (error) {
      console.error("Campaign history loading error:", error);
      alert("Could not load campaign history from MongoDB. Please make sure the backend is running.");
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    localStorage.setItem("aiMarketingSettings", JSON.stringify(settings));
  }, [settings]);

  // -----------------------------
  // PLATFORM ICONS
  // -----------------------------
  const platformIcons = {
    Instagram: <FaInstagram />,
    Facebook: <FaFacebook />,
    "Google Ads": <SiGoogleads />,
    YouTube: <FaYoutube />,
    LinkedIn: <FaLinkedin />,
  };

  // -----------------------------
  // TOGGLE PLATFORM
  // -----------------------------
  const togglePlatform = (platform) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };

  // -----------------------------
  // RESET FORM
  // -----------------------------
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
  };

  // -----------------------------
  // OPTIMIZE CAMPAIGN
  // -----------------------------
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
      const response = await fetch(
        "https://ai-marketing-campaign-optimizer.onrender.com/api/campaign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI optimization failed");
      }

      setResult(data);

      // The backend saves the campaign to MongoDB.
      // Refresh the campaign list so the UI displays the database record.
      await loadCampaigns();
    } catch (error) {
      console.error("Optimization error:", error);

      alert(
        "AI optimization could not be completed. Please make sure the backend and Gemini are running."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // CAMPAIGN FORM
  // -----------------------------
  const renderCampaignForm = () => (
    <>
      <div className="breadcrumb">
        <span>Dashboard</span>
        <span>›</span>
        <strong>Create Campaign</strong>
      </div>

      <div className="page-heading">
        <h1>Create New Campaign</h1>
        <p>
          Provide your campaign details and let AI optimize for maximum
          results
        </p>
      </div>

      <div className="content-grid">
        {/* LEFT MAIN FORM */}
        <div className="main-form-card">

          {/* STEP 1 */}
          <section className="form-section">
            <div className="step-number">1</div>

            <div className="section-content">
              <h2>Describe Your Product / Service</h2>
              <p className="section-description">
                Tell AI what you want to promote.
              </p>

              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                maxLength={500}
                placeholder="Describe your product or service..."
              />

              <div className="example-text">
                Example: We sell eco-friendly water bottles made of
                stainless steel...
              </div>

              <div className="character-count">
                {product.length}/500
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section className="form-section">
            <div className="step-number">2</div>

            <div className="section-content">
              <h2>Set Your Budget</h2>
              <p className="section-description">
                Enter the total amount you want to spend.
              </p>

              <div className="budget-row">
                <div className="input-group">
                  <label>Total Budget (₹)</label>

                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div className="info-box">
                  <FiZap />
                  <span>
                    AI will optimize the budget allocation
                    across channels
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 3 */}
          <section className="form-section">
            <div className="step-number">3</div>

            <div className="section-content">
              <h2>Choose Marketing Platforms</h2>

              <p className="section-description">
                Select the platforms you want to run your campaign on.
              </p>

              <div className="platform-grid">
                {Object.keys(platformIcons).map((platform) => (
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
                      {platformIcons[platform]}
                    </span>

                    <span>{platform}</span>

                    {platforms.includes(platform) && (
                      <span className="platform-check">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* STEP 4 */}
          <section className="form-section">
            <div className="step-number">4</div>

            <div className="section-content">
              <h2>Define Your Target Audience</h2>

              <p className="section-description">
                Tell AI who you want to reach.
              </p>

              <div className="audience-grid">

                <div className="input-group">
                  <label>Age Range</label>

                  <input
                    type="text"
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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Location</label>

                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru"
                  />
                </div>

                <div className="input-group full-width">
                  <label>Interests / Customer Behavior</label>

                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. coffee, fitness, fashion, online shopping"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* STEP 5 */}
          <section className="form-section">
            <div className="step-number">5</div>

            <div className="section-content">
              <h2>Campaign Goal</h2>

              <p className="section-description">
                What do you want to achieve with this campaign?
              </p>

              <div className="goal-grid">

                <button
                  type="button"
                  className={`goal-card ${
                    goal === "Brand Awareness"
                      ? "goal-selected"
                      : ""
                  }`}
                  onClick={() => setGoal("Brand Awareness")}
                >
                  <FiTarget />

                  <div>
                    <strong>Brand Awareness</strong>
                    <span>Increase brand visibility</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`goal-card ${
                    goal === "Lead Generation"
                      ? "goal-selected"
                      : ""
                  }`}
                  onClick={() => setGoal("Lead Generation")}
                >
                  <FiUsers />

                  <div>
                    <strong>Lead Generation</strong>
                    <span>Generate quality leads</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`goal-card ${
                    goal === "Sales"
                      ? "goal-selected"
                      : ""
                  }`}
                  onClick={() => setGoal("Sales")}
                >
                  <FiTrendingUp />

                  <div>
                    <strong>Sales / Conversions</strong>
                    <span>Drive sales and revenue</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`goal-card ${
                    goal === "Website Traffic"
                      ? "goal-selected"
                      : ""
                  }`}
                  onClick={() => setGoal("Website Traffic")}
                >
                  <FiBarChart2 />

                  <div>
                    <strong>Website Traffic</strong>
                    <span>Increase website visits</span>
                  </div>
                </button>

              </div>
            </div>
          </section>

          {/* STEP 6 */}
          <section className="form-section">
            <div className="step-number">6</div>

            <div className="section-content">
              <h2>Additional Details <span>(Optional)</span></h2>

              <p className="section-description">
                Any specific instructions or preferences for AI optimization...
              </p>

              <textarea
                value={additionalDetails}
                onChange={(e) =>
                  setAdditionalDetails(e.target.value)
                }
                maxLength={500}
                placeholder="Example: Focus on young audience, highlight eco-friendly benefits, promote summer offer..."
              />

              <div className="character-count">
                {additionalDetails.length}/500
              </div>
            </div>
          </section>

          {/* BUTTONS */}
          <div className="form-actions">
            <button
              type="button"
              className="reset-button"
              onClick={resetForm}
            >
              Reset
            </button>

            <button
              type="button"
              className="optimize-button"
              onClick={optimizeCampaign}
              disabled={loading}
            >
              <FiZap />

              {loading
                ? "AI is analyzing..."
                : "Optimize Campaign with AI"}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <aside className="right-column">

          {/* CAMPAIGN SUMMARY */}
          <div className="side-card">
            <div className="side-card-title">
              <FiFileText />
              <h2>Campaign Summary</h2>
            </div>

            <div className="summary-item">
              <strong>Product / Service</strong>
              <span>{product || "Not specified"}</span>
            </div>

            <div className="summary-item">
              <strong>Budget</strong>
              <span>
                {budget ? `₹${Number(budget).toLocaleString("en-IN")}` : "Not specified"}
              </span>
            </div>

            <div className="summary-item">
              <strong>Platforms</strong>

              <div className="summary-platforms">
                {platforms.length > 0 ? (
                  platforms.map((platform) => (
                    <span key={platform}>
                      {platformIcons[platform]}
                    </span>
                  ))
                ) : (
                  <small>None selected</small>
                )}
              </div>
            </div>

            <div className="summary-item">
              <strong>Target Audience</strong>

              <ul>
                <li>
                  <FiUsers />
                  Age: {age || "Not specified"}
                </li>

                <li>
                  <FiUsers />
                  Gender: {gender}
                </li>

                <li>
                  <FiMapPin />
                  Location: {location || "Not specified"}
                </li>

                <li>
                  <FiHeart />
                  Interests: {interests || "Not specified"}
                </li>
              </ul>
            </div>

            <div className="summary-item">
              <strong>Goal</strong>
              <span>{goal || "Not specified"}</span>
            </div>
          </div>

          {/* AI PREVIEW */}
          <div className="ai-preview-card">

            <div className="ai-preview-title">
              <FiZap />
              <h2>AI Optimization Preview</h2>
              <span>Beta</span>
            </div>

            <p>
              Our AI will analyze your inputs and provide:
            </p>

            <div className="preview-list">
              <div>
                <FiCheckCircle />
                Optimal budget allocation across platforms
              </div>

              <div>
                <FiCheckCircle />
                Best time to run your ads
              </div>

              <div>
                <FiCheckCircle />
                Audience segments to target
              </div>

              <div>
                <FiCheckCircle />
                Ad content recommendations
              </div>

              <div>
                <FiCheckCircle />
                Predicted performance & ROI
              </div>
            </div>

            <div className="preview-bottom">
              <small>AI-powered optimization</small>
              <h3>Smarter Campaign Decisions</h3>
              <p>Based on your campaign data</p>
            </div>

          </div>
        </aside>
      </div>
    </>
  );

  // -----------------------------
  // RESULTS PAGE
  // -----------------------------
  const renderResults = () => {
    const allocation = result?.budgetAllocation || {};

    return (
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
              Your campaign has been optimized for maximum performance
            </p>
          </div>

          <span className="completed-badge">
            Completed
          </span>
        </div>

        {/* TOP PERFORMANCE */}
        <div className="results-grid">

          <div className="performance-card">

            <div className="card-header">
              <h2>Overall Campaign Performance Prediction</h2>

              <span className="excellent-badge">
                Excellent
              </span>
            </div>

            <div className="stats-grid">

              <div className="result-stat">
                <span>Predicted ROI</span>
                <strong>
                  {result?.predictedROI || "—"}
                </strong>
                <small>Estimated</small>
              </div>

              <div className="result-stat">
                <span>Predicted Conversions</span>
                <strong>
                  {result?.conversions || "—"}
                </strong>
                <small>AI prediction</small>
              </div>

              <div className="result-stat">
                <span>Estimated Revenue</span>
                <strong>
                  {result?.revenue || "—"}
                </strong>
                <small>Potential Revenue</small>
              </div>

              <div className="result-stat">
                <span>Confidence Score</span>
                <strong>
                  {result?.confidence || "—"}
                </strong>
                <small>AI confidence</small>
              </div>

            </div>

            <div className="top-recommendation">
              <FiZap />

              <div>
                <strong>Top Recommendation</strong>
                <p>
                  {result?.recommendation ||
                    "Use the recommended platforms and audience segments to maximize campaign performance."}
                </p>
              </div>
            </div>
          </div>

          {/* AUDIENCE */}
          <div className="audience-result-card">

            <div className="card-header">
              <h2>Target Audience Summary</h2>
            </div>

            <div className="audience-result-item">
              <strong>Age</strong>
              <span>{age || "AI recommended"}</span>
            </div>

            <div className="audience-result-item">
              <strong>Gender</strong>
              <span>{gender}</span>
            </div>

            <div className="audience-result-item">
              <strong>Location</strong>
              <span>{location || "AI recommended"}</span>
            </div>

            <div className="audience-result-item">
              <strong>Top Interests</strong>

              <div className="interest-tags">
                {interests
                  ? interests.split(",").map((item, index) => (
                      <span key={index}>
                        {item.trim()}
                      </span>
                    ))
                  : <span>AI recommended</span>}
              </div>
            </div>

          </div>
        </div>

        {/* SECOND ROW */}
        <div className="results-grid">

          {/* BUDGET */}
          <div className="budget-result-card">

            <div className="card-header">
              <h2>Budget Allocation (AI Optimized)</h2>
            </div>

            <div className="budget-result-content">

              <div className="budget-circle">
                <div>
                  <small>Total Budget</small>
                  <strong>
                    ₹{Number(budget || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="allocation-list">

                {Object.entries(allocation).map(
                  ([platform, percentage]) => (
                    <div
                      className="allocation-row"
                      key={platform}
                    >
                      <div>
                        <span className="allocation-icon">
                          {platformIcons[platform] || <FiTarget />}
                        </span>
                        <strong>{platform}</strong>
                      </div>

                      <span>{percentage}</span>
                    </div>
                  )
                )}

                {Object.keys(allocation).length === 0 && (
                  <p>
                    AI budget allocation will appear here.
                  </p>
                )}

              </div>
            </div>
          </div>

          {/* AI RECOMMENDATIONS */}
          <div className="recommendation-result-card">

            <div className="card-header">
              <h2>AI Recommendations</h2>
            </div>

            <div className="recommendation-item">
              <FiClock />
              <div>
                <strong>Best Time to Run Ads</strong>
                <span>
                  {result?.bestTime || "AI recommended"}
                </span>
              </div>
            </div>

            <div className="recommendation-item">
              <FiBriefcase />
              <div>
                <strong>Campaign Duration</strong>
                <span>
                  {result?.duration || "AI recommended"}
                </span>
              </div>
            </div>

            <div className="recommendation-item">
              <FiUsers />
              <div>
                <strong>Recommended Audience</strong>
                <span>
                  {result?.audience || "AI recommended"}
                </span>
              </div>
            </div>

            <div className="recommendation-strategy">
              <strong>Strategy</strong>
              <p>
                {result?.recommendation ||
                  "AI-generated campaign strategy will appear here."}
              </p>
            </div>

          </div>
        </div>

        {/* CAMPAIGN INFORMATION */}
        <div className="campaign-info-card">

          <div className="card-header">
            <h2>Campaign Information</h2>
          </div>

          <div className="campaign-info-grid">

            <div>
              <span>Product / Service</span>
              <strong>{product}</strong>
            </div>

            <div>
              <span>Budget</span>
              <strong>
                ₹{Number(budget || 0).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Goal</span>
              <strong>{goal || "Sales"}</strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{location || "Not specified"}</strong>
            </div>

          </div>

          <button
            className="back-campaign-button"
            onClick={() => setResult(null)}
          >
            ← Edit Campaign
          </button>

        </div>
      </>
    );
  };

  // -----------------------------
  // APPLICATION MODULES
  // -----------------------------
  const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
  const getROI = (item) => parseFloat(String(item?.result?.predictedROI || "0").replace(/[^0-9.]/g, "")) || 0;
  const getRevenue = (item) => Number(String(item?.result?.revenue || "0").replace(/[^0-9.]/g, "")) || 0;
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (Number(c.result?.conversions) || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + getRevenue(c), 0);
  const averageROI = campaigns.length ? campaigns.reduce((sum, c) => sum + getROI(c), 0) / campaigns.length : 0;

  const openSavedCampaign = (c) => {
    setProduct(c.product || "");
    setBudget(String(c.budget || ""));
    setLocation(c.location || "");
    setInterests(c.interests || "");
    setAge(c.age || "");
    setGender(c.gender || "All");
    setGoal(c.goal || "Sales");
    setPlatforms(c.platforms || []);
    setResult(c.result || c.aiResult || null);
    setActivePage("Create Campaign");
  };

  const renderDashboard = () => <>
    <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Overview</strong></div>
    <div className="page-heading"><h1>Dashboard</h1><p>Monitor your AI-powered marketing campaigns and performance.</p></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:18,marginBottom:24}}>
      {[['Total Campaigns',campaigns.length],['Total Budget',currency(totalBudget)],['Average ROI',averageROI ? `${averageROI.toFixed(1)}x` : '—'],['Predicted Conversions',totalConversions || '—']].map(([label,value])=><div key={label} style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:22}}><span style={{fontSize:13,color:'#777'}}>{label}</span><h2 style={{margin:'8px 0 0'}}>{value}</h2></div>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:22}}>
      <div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:24}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2>Recent Campaigns</h2><p style={{color:'#777'}}>Latest AI optimized campaigns</p></div><button className="optimize-button" onClick={()=>setActivePage('Campaigns')}>View All</button></div>{campaigns.length ? campaigns.slice(0,5).map(c=><div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #eee',padding:'14px 0'}}><div><strong>{c.product || 'Untitled Campaign'}</strong><div style={{fontSize:12,color:'#777'}}>{c.goal} · {currency(c.budget)}</div></div><button className="back-campaign-button" onClick={()=>openSavedCampaign(c)}>View Results</button></div>) : <p style={{color:'#777'}}>No campaigns yet. Create your first campaign.</p>}</div>
      <div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:24}}><h2>Quick Actions</h2>{[['Create Campaign','Start a new campaign'],['Analytics','Review performance'],['AI Recommendations','View AI strategy']].map(([title,desc])=><button key={title} onClick={()=>setActivePage(title)} style={{display:'block',width:'100%',textAlign:'left',padding:15,marginBottom:10,border:'1px solid #eee',borderRadius:12,background:'#fafafd',cursor:'pointer'}}><strong>{title}</strong><div style={{fontSize:12,color:'#777'}}>{desc}</div></button>)}</div>
    </div>
  </>;

  const renderCampaigns = () => <>
    <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Campaigns</strong></div><div className="page-heading"><h1>Campaigns</h1><p>View and manage your saved campaigns.</p></div>
    <div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:24}}><div style={{display:'flex',justifyContent:'space-between'}}><h2>Campaign History ({campaigns.length})</h2><button className="optimize-button" onClick={()=>{setResult(null);setActivePage('Create Campaign')}}>+ New Campaign</button></div>{campaigns.length ? campaigns.map(c=><div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #eee',padding:'17px 0'}}><div><strong>{c.product}</strong><div style={{fontSize:12,color:'#777'}}>{c.goal} · {c.platforms?.join(', ')} · {currency(c.budget)}</div></div><button className="back-campaign-button" onClick={()=>openSavedCampaign(c)}>View Results</button></div>) : <p style={{color:'#777'}}>No saved campaigns yet.</p>}</div>
  </>;

  const renderAnalytics = () => { const counts={}; campaigns.forEach(c=>(c.platforms||[]).forEach(p=>counts[p]=(counts[p]||0)+1)); return <>
    <div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Analytics</strong></div><div className="page-heading"><h1>Analytics</h1><p>Performance estimates from your saved AI campaign results.</p></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>{[['Campaigns',campaigns.length],['Total Budget',currency(totalBudget)],['Average ROI',averageROI?`${averageROI.toFixed(2)}x`:'—'],['Conversions',totalConversions||'—'],['Estimated Revenue',currency(totalRevenue)],['Platforms Used',Object.keys(counts).length||'—']].map(([a,b])=><div key={a} style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:20}}><span style={{color:'#777',fontSize:13}}>{a}</span><h2>{b}</h2></div>)}</div>
    <div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:24,marginTop:22}}><h2>Platform Usage</h2>{Object.keys(counts).length?Object.entries(counts).map(([p,n])=><div key={p} style={{margin:'16px 0'}}><div style={{display:'flex',justifyContent:'space-between'}}><span>{p}</span><b>{n}</b></div><div style={{height:8,background:'#eee',borderRadius:8,marginTop:6}}><div style={{height:'100%',width:`${Math.min(100,n/campaigns.length*100)}%`,background:'#7c3aed',borderRadius:8}}/></div></div>):<p style={{color:'#777'}}>Create campaigns to see platform analytics.</p>}<p style={{fontSize:12,color:'#777'}}>AI metrics are estimates until real advertising platform data is connected.</p></div>
  </>; };

  const renderAIRecommendations = () => { const r=campaigns[0]?.result; return <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>AI Recommendations</strong></div><div className="page-heading"><h1>AI Recommendations</h1><p>Recommendations from your latest optimized campaign.</p></div><div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:26}}>{r?<><div className="recommendation-item"><FiZap/><div><strong>Top Recommendation</strong><span>{r.recommendation||'AI recommendation available'}</span></div></div><div className="recommendation-item"><FiClock/><div><strong>Best Time</strong><span>{r.bestTime||'AI recommended'}</span></div></div><div className="recommendation-item"><FiBriefcase/><div><strong>Duration</strong><span>{r.duration||'AI recommended'}</span></div></div><div className="recommendation-item"><FiUsers/><div><strong>Audience</strong><span>{r.audience||'AI recommended'}</span></div></div></>:<p style={{color:'#777'}}>Create a campaign first.</p>}</div></>; };

  const renderBudgetOptimizer = () => { const c=campaigns[0], allocation=c?.result?.budgetAllocation||{}; return <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Budget Optimizer</strong></div><div className="page-heading"><h1>Budget Optimizer</h1><p>Review the AI allocation for your latest campaign.</p></div><div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:26}}>{c?<><h2>{c.product}</h2><p>Total Budget: <b>{currency(c.budget)}</b></p>{Object.entries(allocation).map(([p,v])=><div key={p} style={{display:'flex',justifyContent:'space-between',padding:'15px 0',borderTop:'1px solid #eee'}}><span>{p}</span><b>{v}</b></div>)}</>:<p style={{color:'#777'}}>Create a campaign to see AI budget allocation.</p>}</div></>; };

  const renderAdPerformance = () => <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Ad Performance</strong></div><div className="page-heading"><h1>Ad Performance</h1><p>Predicted performance for your campaigns.</p></div><div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:26}}>{campaigns.length?campaigns.map(c=><div key={c.id} style={{padding:'16px 0',borderBottom:'1px solid #eee'}}><strong>{c.product}</strong><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:10,fontSize:13}}><span>ROI: <b>{c.result?.predictedROI||'—'}</b></span><span>Conversions: <b>{c.result?.conversions||'—'}</b></span><span>Confidence: <b>{c.result?.confidence||'—'}</b></span></div></div>):<p style={{color:'#777'}}>No performance data yet.</p>}</div></>;

  const renderAudienceInsights = () => <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Audience Insights</strong></div><div className="page-heading"><h1>Audience Insights</h1><p>Audience inputs from your saved campaigns.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:18}}>{campaigns.length?campaigns.map(c=><div key={c.id} style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:22}}><h3>{c.product}</h3><p><b>Age:</b> {c.age||'Not specified'}</p><p><b>Gender:</b> {c.gender}</p><p><b>Location:</b> {c.location||'Not specified'}</p><p><b>Interests:</b> {c.interests||'Not specified'}</p></div>):<div style={{background:'#fff',padding:25,borderRadius:16}}>No audience data yet.</div>}</div></>;

  const renderReports = () => <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Reports</strong></div><div className="page-heading"><h1>Reports</h1><p>Campaign summary for analysis and demonstration.</p></div><div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:26}}><h2>Campaign Report</h2><p>Total campaigns: <b>{campaigns.length}</b></p><p>Total budget: <b>{currency(totalBudget)}</b></p><p>Average predicted ROI: <b>{averageROI?`${averageROI.toFixed(2)}x`:'—'}</b></p><p>Predicted conversions: <b>{totalConversions||'—'}</b></p><p>Estimated revenue: <b>{currency(totalRevenue)}</b></p><button className="optimize-button" onClick={()=>window.print()}>Print / Save Report</button></div></>;

  const renderSettings = () => <><div className="breadcrumb"><span>Dashboard</span><span>›</span><strong>Settings</strong></div><div className="page-heading"><h1>Settings</h1><p>Basic application preferences.</p></div><div style={{background:'#fff',border:'1px solid #e8e8ef',borderRadius:16,padding:26,maxWidth:650}}><label><b>Profile Name</b><input value={settings.name||'Hasini G P'} onChange={e=>setSettings({...settings,name:e.target.value})} style={{display:'block',width:'100%',padding:12,marginTop:8,boxSizing:'border-box'}}/></label><label style={{display:'flex',gap:10,marginTop:20}}><input type="checkbox" checked={settings.aiEnabled!==false} onChange={e=>setSettings({...settings,aiEnabled:e.target.checked})}/> Enable AI optimization</label><p style={{fontSize:12,color:'#777'}}>Settings are stored locally in this browser for now.</p></div></>;

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <FiZap />
          </div>

          <div>
            <strong>AI Marketing</strong>
            <span>Campaign Optimizer</span>
          </div>

        </div>

        <nav className="navigation">

          <div
            className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("Dashboard")}
          >
            <FiHome />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activePage === "Create Campaign" ? "active" : ""}`}
            onClick={() => {
              setActivePage("Create Campaign");
              setResult(null);
            }}
          >
            <FiPlus />
            <span>Create Campaign</span>
          </div>

          <div
            className={`nav-item ${activePage === "Campaigns" ? "active" : ""}`}
            onClick={() => setActivePage("Campaigns")}
          >
            <FiFileText />
            <span>Campaigns</span>
          </div>

          <div className={`nav-item ${activePage === "Analytics" ? "active" : ""}`} onClick={() => setActivePage("Analytics")}>
            <FiBarChart2 />
            <span>Analytics</span>
          </div>

          <div className={`nav-item ${activePage === "AI Recommendations" ? "active" : ""}`} onClick={() => setActivePage("AI Recommendations")}>
            <FiZap />
            <span>AI Recommendations</span>
          </div>

          <div className={`nav-item ${activePage === "Budget Optimizer" ? "active" : ""}`} onClick={() => setActivePage("Budget Optimizer")}>
            <FiDollarSign />
            <span>Budget Optimizer</span>
          </div>

          <div className={`nav-item ${activePage === "Ad Performance" ? "active" : ""}`} onClick={() => setActivePage("Ad Performance")}>
            <FiTrendingUp />
            <span>Ad Performance</span>
          </div>

          <div className={`nav-item ${activePage === "Audience Insights" ? "active" : ""}`} onClick={() => setActivePage("Audience Insights")}>
            <FiUsers />
            <span>Audience Insights</span>
          </div>

          <div className={`nav-item ${activePage === "Reports" ? "active" : ""}`} onClick={() => setActivePage("Reports")}>
            <FiFileText />
            <span>Reports</span>
          </div>

          <div className={`nav-item ${activePage === "Settings" ? "active" : ""}`} onClick={() => setActivePage("Settings")}>
            <FiSettings />
            <span>Settings</span>
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="ai-status">
            <span className="status-dot"></span>

            <div>
              <strong>AI Engine</strong>
              <small>Ready to optimize</small>
            </div>
          </div>

          <div className="nav-item logout">
            <FiLogOut />
            <span>Logout</span>
          </div>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="topbar">

          <div className="topbar-left">
            <button className="menu-button">
              ☰
            </button>
          </div>

          <div className="topbar-right">

            <button className="notification">
              <FiBell />
              <span>3</span>
            </button>

            <div className="profile">

              <div className="avatar">
                H
              </div>

              <div className="profile-info">
                <strong>Hasini G P</strong>
                <small>Student</small>
              </div>

              <FiChevronDown />

            </div>

          </div>

        </header>

        {/* PAGE */}
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