import { useEffect, useState } from "react";
import axios from "axios";

import {
  AlertTriangle,
  Flame,
  Waves,
  MapPin,
  Activity,
  ShieldAlert,
  Upload,
  Brain,
  RefreshCw
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";


// =========================================================
// LEAFLET MARKER FIX
// =========================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});


// =========================================================
// BACKEND
// =========================================================

const API = "https://crisislens-ai-hjdl.onrender.com";


function MapUpdater({ incidents }) {
  const map = useMap();

  useEffect(() => {
    const validIncidents = incidents.filter(
      (incident) =>
        incident.latitude !== null &&
        incident.latitude !== undefined &&
        incident.longitude !== null &&
        incident.longitude !== undefined &&
        Number.isFinite(Number(incident.latitude)) &&
        Number.isFinite(Number(incident.longitude))
    );

    if (validIncidents.length === 0) return;

    const points = validIncidents.map((incident) => [
      Number(incident.latitude),
      Number(incident.longitude)
    ]);

    if (points.length === 1) {
      map.setView(points[0], 12, { animate: true });
    } else {
      map.fitBounds(points, {
        padding: [50, 50],
        maxZoom: 12,
        animate: true
      });
    }
  }, [incidents, map]);

  return null;
}


function App() {

  // =======================================================
  // STATE
  // =======================================================

  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);

  // Image AI
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // New incident information
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentLatitude, setIncidentLatitude] = useState("");
  const [incidentLongitude, setIncidentLongitude] = useState("");
  const [incidentPeople, setIncidentPeople] = useState("0");

  // Location Intelligence
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationResolved, setLocationResolved] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [incidentCreated, setIncidentCreated] = useState(false);

  // AI Decision Explanation
  const [incidentAnalysis, setIncidentAnalysis] = useState(null);

  // Dashboard location filter
  const [activeLocation, setActiveLocation] = useState("");

  // Emergency Response Plan
  const [responsePlan, setResponsePlan] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);

  // Live Emergency Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertLoading, setAlertLoading] = useState(true);

  // AI Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);


  // =======================================================
  // LOAD INCIDENTS
  // =======================================================

  const loadIncidents = () => {

    setLoading(true);

    axios
      .get(`${API}/incidents`)

      .then((response) => {

        setIncidents(response.data);

      })

      .catch((error) => {

        console.error(
          "Backend error:",
          error
        );

      })

      .finally(() => {

        setLoading(false);

      });
  };


  // Load incidents when application starts

  useEffect(() => {

    loadIncidents();

  }, []);


  // =======================================================
  // LOAD LIVE EMERGENCY ALERTS
  // =======================================================

  const loadAlerts = async () => {

    try {

      setAlertLoading(true);

      const response = await axios.get(
        `${API}/alerts`
      );

      setAlerts(
        response.data?.alerts || []
      );

    } catch (error) {

      console.error(
        "Alert loading error:",
        error
      );

      setAlerts([]);

    } finally {

      setAlertLoading(false);

    }

  };


  // Load alerts when application starts

  useEffect(() => {

    loadAlerts();

  }, []);


  // =======================================================
  // LOAD AI ANALYTICS
  // =======================================================

  const loadAnalytics = async () => {

    try {

      setAnalyticsLoading(true);

      const response = await axios.get(
        `${API}/analytics`
      );

      setAnalytics(
        response.data
      );

    } catch (error) {

      console.error(
        "Analytics loading error:",
        error
      );

      setAnalytics(null);

    } finally {

      setAnalyticsLoading(false);

    }

  };


  // Load analytics when application starts

  useEffect(() => {

    loadAnalytics();

  }, []);


  // =======================================================
  // LOCATION-SPECIFIC DASHBOARD DATA
  // =======================================================

  const normalizeLocation = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const filteredIncidents = activeLocation.trim()
    ? incidents.filter((incident) =>
        normalizeLocation(incident.location).includes(
          normalizeLocation(activeLocation)
        ) ||
        normalizeLocation(activeLocation).includes(
          normalizeLocation(incident.location)
        )
      )
    : incidents;

  const filteredAlerts = activeLocation.trim()
    ? alerts.filter((alert) =>
        normalizeLocation(alert.location).includes(
          normalizeLocation(activeLocation)
        ) ||
        normalizeLocation(activeLocation).includes(
          normalizeLocation(alert.location)
        )
      )
    : alerts;

  const filteredAnalytics = (() => {
    const totalIncidents = filteredIncidents.length;
    const totalPeopleAffected = filteredIncidents.reduce(
      (sum, incident) => sum + (Number(incident.people_affected) || 0),
      0
    );
    const totalRisk = filteredIncidents.reduce(
      (sum, incident) => sum + (Number(incident.risk_score) || 0),
      0
    );

    const severityDistribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    const disasterDistribution = {};

    filteredIncidents.forEach((incident) => {
      if (severityDistribution[incident.severity] !== undefined) {
        severityDistribution[incident.severity] += 1;
      }

      const type = String(incident.disaster_type || "Unknown").trim();
      disasterDistribution[type] =
        (disasterDistribution[type] || 0) + 1;
    });

    const mostFrequentDisaster =
      Object.keys(disasterDistribution).length > 0
        ? Object.keys(disasterDistribution).reduce((a, b) =>
            disasterDistribution[a] >= disasterDistribution[b] ? a : b
          )
        : null;

    return {
      total_incidents: totalIncidents,
      total_people_affected: totalPeopleAffected,
      average_risk_score:
        totalIncidents > 0
          ? Number((totalRisk / totalIncidents).toFixed(1))
          : 0,
      severity_distribution: severityDistribution,
      disaster_distribution: disasterDistribution,
      most_frequent_disaster: mostFrequentDisaster
    };
  })();

  const clearLocationFilter = () => {
    setActiveLocation("");
  };


  // =======================================================
  // STATISTICS
  // =======================================================

  const critical = filteredIncidents.filter(
    (item) => item.severity === "CRITICAL"
  ).length;


  const high = filteredIncidents.filter(
    (item) => item.severity === "HIGH"
  ).length;


  const medium = filteredIncidents.filter(
    (item) => item.severity === "MEDIUM"
  ).length;


  // =======================================================
  // IMAGE ANALYSIS
  // =======================================================

  const analyzeImage = async () => {

    if (!selectedFile) {

      alert(
        "Please select an image first."
      );

      return;
    }


    setImageLoading(true);
    setImageResult(null);
    setIncidentCreated(false);


    const formData = new FormData();

    formData.append(
      "file",
      selectedFile
    );


    try {

      const response = await axios.post(
        `${API}/analyze-image`,
        formData
      );


      setImageResult(
        response.data
      );

    }

    catch (error) {

      console.error(
        "Image analysis error:",
        error
      );

      alert(
        "Image analysis failed."
      );

    }

    finally {

      setImageLoading(false);

    }

  };


  // =======================================================
  // LOCATION INTELLIGENCE
  // =======================================================

  const resolveIncidentLocation = async (locationValue = incidentLocation) => {
    const location = locationValue.trim();

    if (!location) {
      setLocationResolved(false);
      setLocationMessage("");
      setIncidentLatitude("");
      setIncidentLongitude("");
      return false;
    }

    try {
      setLocationLoading(true);
      setLocationResolved(false);
      setLocationMessage("🌍 Searching worldwide...");

      // -----------------------------------------------------
      // 1. Check browser cache first
      // -----------------------------------------------------
      const cacheKey = `crisislens-location-${location.toLowerCase()}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);

        setIncidentLatitude(String(cachedData.latitude));
        setIncidentLongitude(String(cachedData.longitude));
        setLocationResolved(true);
        setLocationMessage(`✓ Location found: ${cachedData.display_name}`);
        return true;
      }

      // -----------------------------------------------------
      // 2. Try backend location intelligence
      // -----------------------------------------------------
      try {
        const response = await axios.get(`${API}/location`, {
          params: { location },
          timeout: 6000
        });

        if (response.data?.found) {
          const data = {
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            display_name:
              response.data.matched_location || location
          };

          sessionStorage.setItem(cacheKey, JSON.stringify(data));

          setIncidentLatitude(String(data.latitude));
          setIncidentLongitude(String(data.longitude));
          setLocationResolved(true);
          setLocationMessage(`✓ Location found: ${data.display_name}`);
          setActiveLocation(location);
          return true;
        }
      } catch (backendError) {
        console.warn(
          "Backend location search failed. Trying global browser search...",
          backendError
        );
      }

      // -----------------------------------------------------
      // 3. GLOBAL FALLBACK: OpenStreetMap Nominatim
      // -----------------------------------------------------
      // One request is made only when the user clicks the
      // button. Results are cached to avoid repeated requests.
      const params = new URLSearchParams({
        q: location,
        format: "jsonv2",
        limit: "1",
        addressdetails: "1",
        "accept-language": "en"
      });

      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!geoResponse.ok) {
        throw new Error(
          `Global geocoder returned ${geoResponse.status}`
        );
      }

      const results = await geoResponse.json();

      if (Array.isArray(results) && results.length > 0) {
        const result = results[0];

        const data = {
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          display_name: result.display_name || location
        };

        sessionStorage.setItem(cacheKey, JSON.stringify(data));

        setIncidentLatitude(String(data.latitude));
        setIncidentLongitude(String(data.longitude));
        setLocationResolved(true);
        setLocationMessage(`✓ Location found: ${data.display_name}`);

        return true;
      }

      setIncidentLatitude("");
      setIncidentLongitude("");
      setLocationResolved(false);
      setLocationMessage(
        "❌ Location not found. Try adding the country, state, city, landmark, or full address."
      );

      return false;

    } catch (error) {
      console.error("Global location lookup error:", error);

      setIncidentLatitude("");
      setIncidentLongitude("");
      setLocationResolved(false);
      setLocationMessage(
        "❌ Global location search failed. Check your internet connection and try again."
      );

      return false;

    } finally {
      setLocationLoading(false);
    }
  };

  // =======================================================
  // CREATE INCIDENT FROM AI RESULT
  // =======================================================

  const createIncidentFromImage = async () => {

    // Make sure AI result exists

    if (
      !imageResult ||
      !imageResult.analysis ||
      imageResult.analysis.length === 0
    ) {

      alert(
        "Please analyze an image first."
      );

      return;
    }


    // Location is required

    if (!incidentLocation.trim()) {

      alert(
        "Please enter the incident location."
      );

      return;
    }


    // Automatically resolve coordinates from the location name.
    let hasCoordinates =
      incidentLatitude !== "" &&
      incidentLongitude !== "";

    if (!hasCoordinates) {
      hasCoordinates = await resolveIncidentLocation();

      if (!hasCoordinates) {
        alert(
          "Location could not be resolved. Please check the place name and try again."
        );
        return;
      }
    }


    // Get AI's highest prediction

    const topPrediction =
      imageResult.analysis[0];


    // Convert model label into readable name

    let disasterType =
      topPrediction.label
        .replaceAll("_", " ")
        .replace(
          /disaster/gi,
          ""
        )
        .trim();


    // Confidence percentage

    const confidence = Math.round(
      topPrediction.score * 100
    );


    // People affected

    const peopleAffected =
      Number(incidentPeople) || 0;


    // Description generated from AI result

    const description =
      `AI image analysis detected ${disasterType} with ${confidence}% confidence.`;


    try {

      await axios.post(
        `${API}/analyze`,
        {

          location:
            incidentLocation.trim(),

          disaster_type:
            disasterType,

          description:
            description,

          people_affected:
            peopleAffected,

          latitude:
            Number(incidentLatitude),

          longitude:
            Number(incidentLongitude)

        }
      );


      // Success

      setIncidentCreated(true);


      // Refresh all dashboard sections for the selected location
      await loadIncidents();
      await loadAlerts();
      await loadAnalytics();
      setActiveLocation(incidentLocation.trim());


    }

    catch (error) {

      console.error(
        "Incident creation error:",
        error
      );


      if (
        error.response
      ) {

        console.error(
          "Server response:",
          error.response.data
        );

      }


      alert(
        "Failed to create incident."
      );

    }

  };


  // =======================================================
  // RESET IMAGE ANALYSIS
  // =======================================================

  const resetImageAnalysis = () => {

    setSelectedFile(null);

    setImageResult(null);

    setIncidentLocation("");

    setIncidentLatitude("");

    setIncidentLongitude("");

    setLocationResolved(false);

    setLocationMessage("");

    setIncidentPeople("0");

    setIncidentCreated(false);

    setIncidentAnalysis(null);

  };


  // =======================================================
  // INCIDENT ICON
  // =======================================================

  const getIcon = (type) => {

    const disaster =
      type?.toLowerCase() || "";


    if (
      disaster.includes("fire")
    ) {

      return <Flame />;

    }


    return <Waves />;

  };


  // =======================================================
  // MAP INCIDENTS
  // =======================================================

  const mappedIncidents =
    filteredIncidents.filter(

      (incident) =>

        incident.latitude !== null &&
        incident.latitude !== undefined &&
        incident.longitude !== null &&
        incident.longitude !== undefined

    );


  // =======================================================
  // EMERGENCY RESPONSE PLAN
  // =======================================================

  const getResponsePlan = async (incidentId) => {
    try {
      setResponseLoading(true);
      setResponsePlan(null);

      const response = await axios.get(
        `${API}/response/${incidentId}`
      );

      setResponsePlan(response.data);
    } catch (error) {
      console.error("Response plan error:", error);
      alert("Failed to load response plan.");
    } finally {
      setResponseLoading(false);
    }
  };


  // =======================================================
  // UI
  // =======================================================

  return (

    <div className="app">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>

          <h1>
            🚨 CrisisLens AI
          </h1>

          <p>
            AI-Powered Emergency Intelligence Platform
          </p>

        </div>


        <div className="live">

          <span></span>

          SYSTEM ONLINE

        </div>

      </header>



      {/* =================================================
          ACTIVE LOCATION FILTER
      ================================================= */}

      {activeLocation && (
        <section
          className="panel"
          style={{
            marginBottom: "18px",
            padding: "14px 18px",
            border: "1px solid #2563eb",
            background: "#0f1f38"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <div>
              <strong>📍 Showing data for: {activeLocation}</strong>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#94a3b8",
                  fontSize: "13px"
                }}
              >
                Incidents, alerts, analytics and map markers are filtered
                for this location.
              </p>
            </div>

            <button
              onClick={clearLocationFilter}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                background: "#334155",
                color: "white",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Show All
            </button>
          </div>
        </section>
      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="stats">


        <div className="card critical">

          <ShieldAlert
            size={32}
          />

          <div>

            <p>
              Critical
            </p>

            <h2>
              {critical}
            </h2>

          </div>

        </div>



        <div className="card high">

          <AlertTriangle
            size={32}
          />

          <div>

            <p>
              High Risk
            </p>

            <h2>
              {high}
            </h2>

          </div>

        </div>



        <div className="card medium">

          <Activity
            size={32}
          />

          <div>

            <p>
              Medium
            </p>

            <h2>
              {medium}
            </h2>

          </div>

        </div>



        <div className="card total">

          <MapPin
            size={32}
          />

          <div>

            <p>
              Total Incidents
            </p>

            <h2>
              {filteredIncidents.length}
            </h2>

          </div>

        </div>

      </section>



      {/* =================================================
          AI IMAGE ANALYSIS
      ================================================= */}

      <section className="panel ai-panel">


        <div className="panel-title">

          <div>

            <h2>

              <Brain
                size={22}
              />

              AI Disaster Image Analysis

            </h2>


            <p>

              Upload an image and let
              CrisisLens identify the
              disaster category.

            </p>

          </div>

        </div>



        {/* UPLOAD AREA */}

        <div className="upload-area">

          <Upload
            size={35}
          />


          {/* FILE */}

          <input

            type="file"

            accept="image/*"

            onChange={(e) => {

              const file =
                e.target.files[0];

              setSelectedFile(
                file
              );

              setImageResult(
                null
              );

              setIncidentCreated(
                false
              );

            }}

          />


          {/* SELECTED FILE */}

          {selectedFile && (

            <p className="selected-file">

              Selected:

              {" "}

              {selectedFile.name}

            </p>

          )}


          {/* ANALYZE BUTTON */}

          <button

            onClick={
              analyzeImage
            }

            disabled={
              imageLoading
            }

          >

            {imageLoading
              ? "Analyzing..."
              : "Analyze Image"}

          </button>


        </div>



        {/* =================================================
            AI RESULT
        ================================================= */}

        {imageResult && (

          <div className="ai-result">


            <h3>
              🤖 AI Analysis Result
            </h3>


            <p>

              <strong>
                File:
              </strong>

              {" "}

              {
                imageResult.filename
              }

            </p>


            {/* PREDICTIONS */}

            {imageResult.analysis?.map(
              (item, index) => (

                <div

                  className={
                    index === 0
                      ? "prediction top"
                      : "prediction"
                  }

                  key={index}

                >

                  <span>

                    {
                      item.label
                    }

                  </span>


                  <strong>

                    {
                      (
                        item.score * 100
                      ).toFixed(1)
                    }%

                  </strong>

                </div>

              )
            )}



            {/* =================================================
                CREATE INCIDENT
            ================================================= */}

            <div className="incident-create">


              <h3>
                🚨 Create Emergency Incident
              </h3>


              <p className="create-help">

                Use the AI prediction to
                create a real incident in
                the CrisisLens dashboard.

              </p>



              {/* LOCATION */}

              <input

                type="text"

                placeholder="Incident location e.g. Trichy Railway Station"

                value={
                  incidentLocation
                }

                onChange={(e) => {
                  setIncidentLocation(e.target.value);
                  setLocationResolved(false);
                  setLocationMessage("");
                  setIncidentLatitude("");
                  setIncidentLongitude("");
                }}

              />



              {/* LOCATION INTELLIGENCE */}

              <button
                type="button"
                onClick={() => resolveIncidentLocation()}
                disabled={locationLoading || !incidentLocation.trim()}
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: "8px",
                  background: locationLoading ? "#475569" : "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  cursor:
                    locationLoading || !incidentLocation.trim()
                      ? "not-allowed"
                      : "pointer"
                }}
              >
                {locationLoading
                  ? "📍 Finding Location..."
                  : "📍 Find Any Place Worldwide"}
              </button>

              {locationMessage && (
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: "10px",
                    color: locationResolved ? "#22c55e" : "#f59e0b",
                    fontSize: "14px"
                  }}
                >
                  {locationMessage}
                </p>
              )}

              {locationResolved && (
                <small
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "#94a3b8"
                  }}
                >
                  Coordinates detected automatically:{" "}
                  {incidentLatitude}, {incidentLongitude}
                </small>
              )}


              {/* PEOPLE AFFECTED */}

              <input

                type="number"

                min="0"

                placeholder="People affected"

                value={
                  incidentPeople
                }

                onChange={(e) =>
                  setIncidentPeople(
                    e.target.value
                  )
                }

              />



              {/* CREATE */}

              <button

                className="create-incident"

                onClick={
                  createIncidentFromImage
                }

                disabled={
                  incidentCreated
                }

              >

                {incidentCreated

                  ? "✅ Incident Created"

                  : "🚨 Create Emergency Incident"

                }

              </button>



              {/* SUCCESS */}

              {incidentCreated && (

                <p className="success-message">

                  ✅ AI incident created
                  successfully and added
                  to the dashboard and map.

                </p>

              )}



              {/* RESET */}

              <button

                className="reset-analysis"

                onClick={
                  resetImageAnalysis
                }

              >

                Clear Analysis

              </button>


            </div>


          </div>

        )}

      </section>



      {/* =================================================
          ACTIVE EMERGENCY ALERTS
      ================================================= */}

      <section className="panel alert-panel">

        <div className="panel-title">

          <div>

            <h2>
              🚨 Active Emergency Alerts
            </h2>

            <p>
              Live high-priority incidents requiring attention
            </p>

          </div>

          <button
            className="refresh"
            onClick={loadAlerts}
            disabled={alertLoading}
          >

            <RefreshCw
              size={18}
            />

          </button>

        </div>


        {alertLoading ? (

          <div className="empty">
            Loading emergency alerts...
          </div>

        ) : alerts.length === 0 ? (

          <div className="alert-clear">
            <span>✓</span>
            No active high-priority alerts
          </div>

        ) : (

          <div className="alert-list">

            {filteredAlerts.map((alert) => (

              <div
                className={`alert-card ${
                  alert.alert_level?.toLowerCase()
                }`}
                key={alert.alert_id}
              >

                <div className="alert-icon">
                  🚨
                </div>

                <div className="alert-content">

                  <div className="alert-top">

                    <div>

                      <h3>
                        {alert.disaster_type}
                      </h3>

                      <p>
                        📍 {alert.location}
                      </p>

                    </div>

                    <span className="alert-badge">
                      {alert.alert_level}
                    </span>

                  </div>

                  <p className="alert-message">
                    {alert.message}
                  </p>

                  <div className="alert-details">

                    <span>
                      ⚠️ Risk: <strong>{alert.risk_score}%</strong>
                    </span>

                    <span>
                      👥 People: <strong>{alert.people_affected}</strong>
                    </span>

                    <span>
                      🔴 Priority: <strong>{alert.priority}</strong>
                    </span>

                    <span>
                      🟢 {alert.status}
                    </span>

                  </div>

                  <button
                    className="alert-response-button"
                    onClick={() =>
                      getResponsePlan(alert.incident_id)
                    }
                  >
                    🚨 View Response Plan
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* =================================================
          AI ANALYTICS DASHBOARD
      ================================================= */}

      <section className="panel analytics-panel">

        <div className="panel-title">

          <div>

            <h2>
              📊 AI Analytics Dashboard
            </h2>

            <p>
              Real-time emergency intelligence and incident statistics
            </p>

          </div>

          <button
            className="refresh"
            onClick={loadAnalytics}
            disabled={analyticsLoading}
          >

            <RefreshCw
              size={18}
            />

          </button>

        </div>


        {analyticsLoading ? (

          <div className="empty">
            Loading analytics...
          </div>

        ) : analytics ? (

          <>

            <div className="analytics-cards">

              <div className="analytics-card">
                <span className="analytics-label">
                  Total Incidents
                </span>
                <strong>
                  {filteredAnalytics.total_incidents}
                </strong>
              </div>

              <div className="analytics-card">
                <span className="analytics-label">
                  People Affected
                </span>
                <strong>
                  {filteredAnalytics.total_people_affected}
                </strong>
              </div>

              <div className="analytics-card">
                <span className="analytics-label">
                  Average Risk
                </span>
                <strong>
                  {filteredAnalytics.average_risk_score}%
                </strong>
              </div>

              <div className="analytics-card">
                <span className="analytics-label">
                  Top Disaster
                </span>
                <strong className="analytics-top-disaster">
                  {filteredAnalytics.most_frequent_disaster || "None"}
                </strong>
              </div>

            </div>


            <div className="analytics-grid">

              <div className="analytics-chart">

                <h3>
                  Severity Distribution
                </h3>

                {Object.entries(
                  filteredAnalytics.severity_distribution || {}
                ).map(([severity, count]) => {

                  const maxSeverity = Math.max(
                    ...(Object.values(
                      filteredAnalytics.severity_distribution || {}
                    )),
                    1
                  );

                  const percentage =
                    (count / maxSeverity) * 100;

                  return (

                    <div
                      className="bar-row"
                      key={severity}
                    >

                      <div className="bar-header">

                        <span>
                          {severity}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>

                      <div className="bar-track">

                        <div
                          className={`bar-fill ${severity.toLowerCase()}`}
                          style={{
                            width: `${percentage}%`
                          }}
                        />

                      </div>

                    </div>

                  );

                })}

              </div>


              <div className="analytics-chart">

                <h3>
                  Disaster Distribution
                </h3>

                {Object.keys(
                  filteredAnalytics.disaster_distribution || {}
                ).length === 0 ? (

                  <div className="empty">
                    No disaster data available.
                  </div>

                ) : (

                  Object.entries(
                    filteredAnalytics.disaster_distribution || {}
                  ).map(([type, count]) => {

                    const maxDisaster = Math.max(
                      ...(Object.values(
                        filteredAnalytics.disaster_distribution || {}
                      )),
                      1
                    );

                    const percentage =
                      (count / maxDisaster) * 100;

                    return (

                      <div
                        className="bar-row"
                        key={type}
                      >

                        <div className="bar-header">

                          <span>
                            {type}
                          </span>

                          <strong>
                            {count}
                          </strong>

                        </div>

                        <div className="bar-track">

                          <div
                            className="bar-fill disaster"
                            style={{
                              width: `${percentage}%`
                            }}
                          />

                        </div>

                      </div>

                    );

                  })

                )}

              </div>

            </div>

          </>

        ) : (

          <div className="empty">
            Analytics unavailable. Please refresh.
          </div>

        )}

      </section>


      {/* =================================================
          MAIN
      ================================================= */}

      <main>


        {/* =================================================
            RECENT INCIDENTS
        ================================================= */}

        <section className="panel">


          <div className="panel-title">

            <div>

              <h2>
                Recent Incidents
              </h2>

              <p>
                AI-analyzed emergency reports
              </p>

            </div>


            <button

              className="refresh"

              onClick={
                loadIncidents
              }

            >

              <RefreshCw
                size={18}
              />

            </button>

          </div>



          {/* LOADING */}

          {loading ? (

            <div className="empty">

              Loading incidents...

            </div>


          ) : incidents.length === 0 ? (


            /* EMPTY */

            <div className="empty">

              No incidents available.

            </div>


          ) : (


            /* INCIDENT LIST */

            <div className="incident-list">


              {filteredIncidents.map(
                (incident) => (

                  <div

                    className="incident"

                    key={
                      incident.id
                    }

                  >


                    {/* ICON */}

                    <div className="incident-icon">

                      {
                        getIcon(
                          incident.disaster_type
                        )
                      }

                    </div>



                    {/* INFORMATION */}

                    <div className="incident-info">


                      <h3>

                        {
                          incident.disaster_type
                        }

                      </h3>


                      <p>

                        📍{" "}

                        {
                          incident.location
                        }

                      </p>


                      <small>

                        {
                          incident.description
                        }

                      </small>


                      <small>

                        👥{" "}

                        {
                          incident.people_affected
                        }

                        {" "}
                        people affected

                      </small>

                    </div>



                    {/* RISK */}

                    <div

                      className={
                        `incident-risk ${
                          incident.severity
                            ?.toLowerCase()
                        }`
                      }

                    >

                      <strong>

                        {
                          incident.severity
                        }

                      </strong>


                      <span>

                        Risk{" "}

                        {
                          incident.risk_score
                        }%

                      </span>

                    </div>


                    {/* RESPONSE PLAN BUTTON */}
                    <button
                      onClick={() => getResponsePlan(incident.id)}
                      style={{
                        marginTop: "12px",
                        padding: "9px 14px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#dc2626",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      🚨 Response Plan
                    </button>


                  </div>

                )
              )}

            </div>

          )}

        </section>



        {/* =================================================
            EMERGENCY RESPONSE PLAN
        ================================================= */}

        {responsePlan && (
          <section className="panel" style={{ marginBottom: "20px" }}>

            <div
              className="panel-title"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <div>
                <h2>🚨 Emergency Response Plan</h2>
                <p>
                  {responsePlan.disaster_type} — {responsePlan.location}
                </p>
              </div>

              <button
                onClick={() => setResponsePlan(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer"
                }}
                aria-label="Close response plan"
              >
                ✕
              </button>
            </div>

            {responseLoading ? (
              <div className="empty">
                Loading response plan...
              </div>
            ) : responsePlan.error ? (
              <div className="empty">
                {responsePlan.error}
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    margin: "18px 0"
                  }}
                >
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#16243a"
                    }}
                  >
                    <strong>Priority</strong>
                    <div style={{ marginTop: "6px", fontWeight: "700" }}>
                      {responsePlan.priority}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#16243a"
                    }}
                  >
                    <strong>Severity</strong>
                    <div style={{ marginTop: "6px", fontWeight: "700" }}>
                      {responsePlan.severity}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#16243a"
                    }}
                  >
                    <strong>Risk Score</strong>
                    <div style={{ marginTop: "6px", fontWeight: "700" }}>
                      {responsePlan.risk_score}%
                    </div>
                  </div>
                </div>

                <h3>Recommended Emergency Actions</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {responsePlan.recommended_actions?.map((action, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "9px",
                        background: "#16243a"
                      }}
                    >
                      <span
                        style={{
                          minWidth: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          background: "#dc2626",
                          color: "white",
                          fontWeight: "700"
                        }}
                      >
                        {index + 1}
                      </span>
                      <p style={{ margin: 0 }}>{action}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}


        {/* =================================================
            INCIDENT MAP
        ================================================= */}

        <section className="panel">


          <div className="panel-title">

            <div>

              <h2>
                🗺️ Incident Map
              </h2>


              <p>
                Geographic intelligence
              </p>

            </div>


            <span>
              LIVE
            </span>

          </div>



          <div className="map">


            <MapContainer

              center={[
                10.7905,
                78.7047
              ]}

              zoom={7}

              scrollWheelZoom={true}

              className="real-map"

            >

              <MapUpdater incidents={mappedIncidents} />


              {/* OPEN STREET MAP */}

              <TileLayer

                attribution=
                  '&copy; OpenStreetMap contributors'

                url=
                  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

              />



              {/* MARKERS */}

              {mappedIncidents.map(
                (incident) => (

                  <Marker

                    key={
                      incident.id
                    }

                    position={[

                      Number(
                        incident.latitude
                      ),

                      Number(
                        incident.longitude
                      )

                    ]}

                  >

                    <Popup>

                      <div>

                        <strong>

                          {
                            incident.disaster_type
                          }

                        </strong>


                        <br />


                        📍{" "}

                        {
                          incident.location
                        }


                        <br />


                        🚨{" "}

                        {
                          incident.severity
                        }


                        <br />


                        Risk:

                        {" "}

                        {
                          incident.risk_score
                        }%


                        <br />


                        👥{" "}

                        {
                          incident.people_affected
                        }

                      </div>

                    </Popup>

                  </Marker>

                )
              )}

            </MapContainer>

          </div>



          {/* MAP INFORMATION */}

          <div className="map-info">

            <span>

              📍{" "}

              {
                mappedIncidents.length
              }

              {" "}
              mapped incidents

            </span>


            <span>

              Total:

              {" "}

              {
                incidents.length
              }

              {" "}
              incidents

            </span>

          </div>


        </section>

      </main>



      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <span>
          CrisisLens AI
        </span>

        <span>
          AI Emergency Intelligence
        </span>

      </footer>


    </div>

  );
}


export default App;