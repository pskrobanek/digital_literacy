"""
Digital Literacy scoring (Self-Reflection v4.0) and app recommendation.

The composite digital literacy score combines the motor/cognitive test result with
four survey dimensions:

    raw = motor_score * tech_breadth * L_factor * resource_quality - access_penalty

    motor_score      -- 0–100 composite from the digital test (calculate_final_test_score)
    tech_breadth     -- 0.7 base + 0.1 per device type used daily (q1, multi-select)
    L_factor         -- self-reported learning strategy multiplier (q2, single-select)
    resource_quality -- best available support resource quality (q3, multi-select, take max)
    access_penalty   -- subtracted points based on how quickly help can be obtained (q4)

Final score is clamped to [0, 100].
"""

TECH_BREADTH_BASE = 0.7
DEVICE_WEIGHTS = {
    "desktop_laptop": 0.1,
    "mobile_tablet": 0.1,
    "mobile_phone": 0.1,
    "smart_watch": 0.0,
}

# Multiplier for q2: "When struggling to learn a technology, I..."
L_FACTOR = {
    "press_buttons": 1.1,  # explores independently — highest multiplier
    "take_break": 1.0,
    "ask_help": 0.8,
    "give_up": 0.4,
}

# q3: "Who usually helps you most?" — take the maximum quality among all selections
RESOURCE_QUALITY = {
    "family": 1.0,
    "friends": 1.0,
    "caregivers": 1.0,
    "professionals": 0.8,
    "no_one": 0.7,
}

# Points subtracted for q4: "How often can you get help?"
PENALTY = {
    "immediately": 0,
    "within_day": 5,
    "within_few_days": 10,
    "once_a_week": 15,
    "rarely": 25,
}

TIER_LOW = "Low"
TIER_MEDIUM = "Medium"
TIER_HIGH = "High"
_TIER_RANK = {TIER_LOW: 0, TIER_MEDIUM: 1, TIER_HIGH: 2}


def tier_for_score(score):
    """Map a 0–100 literacy score to Low / Medium / High tier."""
    if score <= 33:
        return TIER_LOW
    if score <= 66:
        return TIER_MEDIUM
    return TIER_HIGH


# App catalogue with their own usability scores (used to rank within a tier).
# score is the app's own digital-demand score; lower = easier to use.
APPS = [
    {"name": "Oncontest", "score": 10.6, "tier": TIER_LOW, "note": ""},
    {"name": "Noona", "score": 10.6, "tier": TIER_LOW, "note": ""},
    {"name": "Cureety*", "score": 41.7, "tier": TIER_MEDIUM, "note": "Demo score — interpret with caution"},
    {"name": "Medevio", "score": 50.7, "tier": TIER_MEDIUM, "note": ""},
    {"name": "Elekta Kaiku", "score": 72.1, "tier": TIER_HIGH, "note": ""},
    {"name": "MEDDI", "score": 95.0, "tier": TIER_HIGH, "note": ""},
]


def _as_list(value):
    """Normalize a value to a list (handles single strings and None)."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _tech_breadth(q1):
    """
    Compute the tech-breadth multiplier from q1 (multi-select device list).

    Returns TECH_BREADTH_BASE (0.7) plus 0.1 per recognized device type selected.
    Returns 0.0 if no valid device is selected (e.g. patient selected 'none').
    """
    selections = [s for s in _as_list(q1) if isinstance(s, str) and s in DEVICE_WEIGHTS]
    if not selections:
        return 0.0
    return TECH_BREADTH_BASE + sum(DEVICE_WEIGHTS[s] for s in selections)


def _resource_quality(q3):
    """
    Compute the resource-quality factor from q3 (multi-select support sources).

    Takes the maximum quality value among all selections, since having access to
    even one high-quality resource is what matters. Returns None if no valid
    selection is present, which causes compute_literacy_score to return None.
    """
    selections = [s for s in _as_list(q3) if isinstance(s, str) and s in RESOURCE_QUALITY]
    if not selections:
        return None
    return max(RESOURCE_QUALITY[s] for s in selections)


def compute_literacy_score(motor_score, responses):
    """
    Compute the digital literacy score (0–100) from test result and survey responses.

    Args:
        motor_score: The test result string or numeric value (0–100).
        responses:   Dict parsed from SurveyResults.responses JSON.
                     Required keys: q1 (list), q2 (str), q3 (list or str), q4 (str).

    Returns None if any required field is missing or invalid.
    Formula: raw = motor_score * tech_breadth * L_factor * resource_quality - access_penalty
    """
    if motor_score is None or not isinstance(responses, dict):
        return None

    try:
        motor_score = float(motor_score)
    except (TypeError, ValueError):
        return None

    q2 = responses.get("q2")
    q4 = responses.get("q4")
    if not isinstance(q2, str) or not isinstance(q4, str):
        return None
    if q2 not in L_FACTOR or q4 not in PENALTY:
        return None

    resource_quality = _resource_quality(responses.get("q3"))
    if resource_quality is None:
        return None

    tech_breadth = _tech_breadth(responses.get("q1"))

    raw = motor_score * tech_breadth * L_FACTOR[q2] * resource_quality - PENALTY[q4]
    return max(0, min(100, round(raw)))


def recommend_apps(literacy_score):
    """
    Return all apps appropriate for the patient's literacy tier, sorted by app score.

    A patient at tier T sees apps rated for their tier and all lower tiers.
    Sorted ascending by app score so simpler apps appear first.
    Returns an empty list if literacy_score is None.
    """
    if literacy_score is None:
        return []
    max_rank = _TIER_RANK[tier_for_score(literacy_score)]
    return sorted(
        (app for app in APPS if _TIER_RANK[app["tier"]] <= max_rank),
        key=lambda app: app["score"],
    )
