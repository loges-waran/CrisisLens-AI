from fastapi import FastAPI, Depends, UploadFile, File
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, Incident
from vision import analyze_image


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="CrisisLens AI",
    description="AI-Powered Emergency Intelligence Platform",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# =========================================================
# INPUT FORMAT
# =========================================================

class IncidentInput(BaseModel):

    location: str

    disaster_type: str

    description: str

    people_affected: int = 0

    latitude: float | None = None

    longitude: float | None = None


# =========================================================
# LOCATION INTELLIGENCE
# =========================================================

# Known demo locations. The system can automatically
# assign coordinates when the user does not provide them.

LOCATION_COORDINATES = {
    "trichy railway station": (10.8155, 78.6966),
    "tiruchirappalli railway station": (10.8155, 78.6966),
    "trichy": (10.8155, 78.6966),
    "tiruchirappalli": (10.8155, 78.6966),

    "chennai": (13.0827, 80.2707),
    "chennai central": (13.0827, 80.2707),
    "chennai central railway station": (13.0827, 80.2707),

    "coimbatore": (11.0168, 76.9558),
    "coimbatore railway station": (11.0168, 76.9558),

    "madurai": (9.9252, 78.1198),
    "madurai railway station": (9.9252, 78.1198),
}


def resolve_location(location: str):
    """
    Resolve a location name to coordinates.

    Exact known locations are checked first, followed by
    city-name matching for the current supported locations.
    """

    normalized = (
        location.strip()
        .lower()
        .replace(",", "")
    )

    # Exact match
    if normalized in LOCATION_COORDINATES:
        latitude, longitude = LOCATION_COORDINATES[
            normalized
        ]

        return {
            "latitude": latitude,
            "longitude": longitude,
            "matched_location": normalized
        }

    # Partial/city match
    location_aliases = [
        ("trichy", (10.8155, 78.6966)),
        ("tiruchirappalli", (10.8155, 78.6966)),
        ("chennai", (13.0827, 80.2707)),
        ("coimbatore", (11.0168, 76.9558)),
        ("madurai", (9.9252, 78.1198)),
    ]

    for alias, coordinates in location_aliases:

        if alias in normalized:

            return {
                "latitude": coordinates[0],
                "longitude": coordinates[1],
                "matched_location": alias
            }

    return None


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "project": "CrisisLens AI",

        "status": "online",

        "version": "1.0"

    }


# =========================================================
# ANALYZE TEXT REPORT + SAVE INCIDENT
# =========================================================

@app.post("/analyze")
def analyze_incident(

    incident: IncidentInput,

    db: Session = Depends(get_db)

):

    description = (
        incident.description.lower()
    )


    # =====================================================
    # AUTOMATIC LOCATION RESOLUTION
    # =====================================================

    resolved_location = resolve_location(
        incident.location
    )

    latitude = incident.latitude
    longitude = incident.longitude

    if (
        latitude is None
        or longitude is None
    ):

        if resolved_location:

            latitude = resolved_location["latitude"]
            longitude = resolved_location["longitude"]


    score = 0

    reasons = []


    # =====================================================
    # PEOPLE AFFECTED
    # =====================================================

    if incident.people_affected >= 50:

        score += 40

        reasons.append(
            "Large number of people affected"
        )

    elif incident.people_affected >= 10:

        score += 20

        reasons.append(
            "Multiple people affected"
        )


    # =====================================================
    # EMERGENCY WORDS
    # =====================================================

    emergency_words = [

        "trapped",

        "missing",

        "collapsed",

        "dead",

        "fire",

        "rescue",

        "danger"

    ]


    for word in emergency_words:

        if word in description:

            score += 15

            reasons.append(

                f"Emergency indicator: {word}"

            )


    # =====================================================
    # MAJOR DISASTER TYPES
    # =====================================================

    if incident.disaster_type.lower() in [

        "flood",

        "fire",

        "earthquake"

    ]:

        score += 15

        reasons.append(
            "Major disaster category"
        )


    # =====================================================
    # LIMIT SCORE
    # =====================================================

    score = min(score, 100)


    # =====================================================
    # SEVERITY
    # =====================================================

    if score >= 70:

        severity = "CRITICAL"

    elif score >= 45:

        severity = "HIGH"

    elif score >= 20:

        severity = "MEDIUM"

    else:

        severity = "LOW"


    # =====================================================
    # SAVE INCIDENT
    # =====================================================

    new_incident = Incident(

        location=incident.location,

        disaster_type=incident.disaster_type,

        description=incident.description,

        people_affected=incident.people_affected,

        severity=severity,

        risk_score=score,

        latitude=(
            str(latitude)
            if latitude is not None
            else None
        ),

        longitude=(
            str(longitude)
            if longitude is not None
            else None
        )

    )


    db.add(new_incident)

    db.commit()

    db.refresh(new_incident)


    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "incident_id":
            new_incident.id,

        "location":
            incident.location,

        "disaster_type":
            incident.disaster_type,

        "severity":
            severity,

        "risk_score":
            score,

        "reasons":
            reasons,

        "decision_summary":
            (
                f"{severity} risk {incident.disaster_type} detected at "
                f"{incident.location}, affecting {incident.people_affected} people."
            ),

        "latitude":
            latitude,

        "longitude":
            longitude,

        "location_resolved":
            resolved_location is not None,

        "saved":
            True

    }


# =========================================================
# LOCATION LOOKUP
# =========================================================

@app.get("/location")
def get_location_coordinates(
    location: str
):

    resolved_location = resolve_location(
        location
    )

    if not resolved_location:

        return {
            "found": False,
            "location": location,
            "latitude": None,
            "longitude": None,
            "message": (
                "Location not found in the current "
                "location intelligence database."
            )
        }

    return {
        "found": True,
        "location": location,
        "latitude": resolved_location["latitude"],
        "longitude": resolved_location["longitude"],
        "matched_location":
            resolved_location["matched_location"]
    }


# =========================================================
# GET ALL INCIDENTS
# =========================================================

@app.get("/incidents")
def get_incidents(

    db: Session = Depends(get_db)

):

    incidents = (
        db.query(Incident).all()
    )


    # =====================================================
    # OLD INCIDENT COORDINATE FALLBACK
    # =====================================================

    for incident in incidents:

        if (

            incident.latitude is None

            and

            incident.longitude is None

        ):

            location = (
                incident.location.lower()
            )


            if "trichy" in location or "tiruchirappalli" in location:

                incident.latitude = "10.8155"

                incident.longitude = "78.6966"


            elif "chennai" in location:

                incident.latitude = "13.0827"

                incident.longitude = "80.2707"


            elif "coimbatore" in location:

                incident.latitude = "11.0168"

                incident.longitude = "76.9558"


            elif "madurai" in location:

                incident.latitude = "9.9252"

                incident.longitude = "78.1198"


    return incidents


# =========================================================
# AI IMAGE ANALYSIS
# =========================================================

@app.post("/analyze-image")
async def analyze_disaster_image(

    file: UploadFile = File(...)

):

    # -----------------------------------------------------
    # READ IMAGE
    # -----------------------------------------------------

    image_data = await file.read()


    # -----------------------------------------------------
    # TEMPORARY FILE
    # -----------------------------------------------------

    temp_path = "temp_image.jpg"


    with open(
        temp_path,
        "wb"
    ) as f:

        f.write(image_data)


    # -----------------------------------------------------
    # AI MODEL
    # -----------------------------------------------------

    results = analyze_image(
        temp_path
    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "filename":
            file.filename,

        "analysis":
            results

    }


# =========================================================
# EMERGENCY RESPONSE PLAN
# =========================================================

@app.get("/response/{incident_id}")
def get_response_plan(

    incident_id: int,

    db: Session = Depends(get_db)

):

    # -----------------------------------------------------
    # FIND INCIDENT
    # -----------------------------------------------------

    incident = (

        db.query(Incident)

        .filter(
            Incident.id == incident_id
        )

        .first()

    )


    # -----------------------------------------------------
    # INCIDENT NOT FOUND
    # -----------------------------------------------------

    if not incident:

        return {

            "error":
                "Incident not found"

        }


    # -----------------------------------------------------
    # RESPONSE VARIABLES
    # -----------------------------------------------------

    severity = incident.severity


    priority = "NORMAL"

    actions = []


    # =====================================================
    # CRITICAL
    # =====================================================

    if severity == "CRITICAL":

        priority = "IMMEDIATE"


        actions = [

            "Dispatch emergency response team",

            "Initiate rescue operations",

            "Notify local emergency authorities",

            "Evacuate high-risk population",

            "Establish emergency communication"

        ]


    # =====================================================
    # HIGH
    # =====================================================

    elif severity == "HIGH":

        priority = "URGENT"


        actions = [

            "Deploy response team",

            "Monitor affected area",

            "Prepare evacuation support",

            "Notify local authorities"

        ]


    # =====================================================
    # MEDIUM
    # =====================================================

    elif severity == "MEDIUM":

        priority = "MONITOR"


        actions = [

            "Monitor incident",

            "Prepare response resources",

            "Check for escalation"

        ]


    # =====================================================
    # LOW
    # =====================================================

    else:

        priority = "NORMAL"


        actions = [

            "Continue monitoring",

            "Verify incident information"

        ]


    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "incident_id":
            incident.id,

        "location":
            incident.location,

        "disaster_type":
            incident.disaster_type,

        "severity":
            incident.severity,

        "risk_score":
            incident.risk_score,

        "risk_reasons":
            (
                []
                if not incident.description
                else [
                    "Risk score generated from people affected, emergency indicators, and disaster category."
                ]
            ),

        "decision_summary":
            (
                f"{incident.severity} risk {incident.disaster_type} at "
                f"{incident.location}. Response priority: {priority}."
            ),

        "priority":
            priority,

        "recommended_actions":
            actions

    }


# =========================================================
# LIVE EMERGENCY ALERTS
# =========================================================

@app.get("/alerts")
def get_emergency_alerts(
    db: Session = Depends(get_db)
):

    # Get incidents that currently need attention.
    incidents = (
        db.query(Incident)
        .filter(
            Incident.severity.in_(["CRITICAL", "HIGH"])
        )
        .order_by(
            Incident.id.desc()
        )
        .all()
    )

    alerts = []

    for incident in incidents:

        if incident.severity == "CRITICAL":
            priority = "IMMEDIATE"
            alert_level = "CRITICAL"
            message = (
                f"Critical emergency detected at "
                f"{incident.location}"
            )

        else:
            priority = "URGENT"
            alert_level = "HIGH"
            message = (
                f"High-risk emergency detected at "
                f"{incident.location}"
            )

        alerts.append({
            "alert_id": incident.id,
            "incident_id": incident.id,
            "location": incident.location,
            "disaster_type": incident.disaster_type,
            "severity": incident.severity,
            "risk_score": incident.risk_score,
            "people_affected": incident.people_affected,
            "priority": priority,
            "alert_level": alert_level,
            "message": message,
            "status": "ACTIVE",
            "created_at": datetime.now().isoformat()
        })

    return {
        "total_alerts": len(alerts),
        "alerts": alerts
    }


# =========================================================
# AI ANALYTICS & STATISTICS
# =========================================================

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db)
):

    # Get all incidents
    incidents = (
        db.query(Incident)
        .all()
    )

    total_incidents = len(incidents)

    # -----------------------------------------------------
    # BASIC STATISTICS
    # -----------------------------------------------------

    total_people_affected = sum(
        incident.people_affected or 0
        for incident in incidents
    )

    total_risk = sum(
        incident.risk_score or 0
        for incident in incidents
    )

    average_risk_score = (
        round(total_risk / total_incidents, 1)
        if total_incidents > 0
        else 0
    )

    # -----------------------------------------------------
    # SEVERITY DISTRIBUTION
    # -----------------------------------------------------

    severity_distribution = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
    }

    for incident in incidents:

        severity = incident.severity

        if severity in severity_distribution:
            severity_distribution[severity] += 1

    # -----------------------------------------------------
    # DISASTER TYPE DISTRIBUTION
    # -----------------------------------------------------

    disaster_distribution = {}

    for incident in incidents:

        disaster_type = (
            incident.disaster_type
            or "Unknown"
        )

        disaster_type = disaster_type.strip()

        disaster_distribution[disaster_type] = (
            disaster_distribution.get(
                disaster_type,
                0
            ) + 1
        )

    # -----------------------------------------------------
    # MOST FREQUENT DISASTER
    # -----------------------------------------------------

    most_frequent_disaster = None

    if disaster_distribution:

        most_frequent_disaster = max(
            disaster_distribution,
            key=disaster_distribution.get
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "total_incidents": total_incidents,

        "total_people_affected":
            total_people_affected,

        "average_risk_score":
            average_risk_score,

        "severity_distribution":
            severity_distribution,

        "disaster_distribution":
            disaster_distribution,

        "most_frequent_disaster":
            most_frequent_disaster
    }
