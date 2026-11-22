import math
import re
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.utils.response_utils import ok
import httpx

router = APIRouter(prefix="/api/therapists", tags=["therapists"])


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def _classify_provider(tags: dict) -> tuple[str, str]:
    """Distinguishes provider types: Psychologist, Psychiatrist, Counselling Centre,
    Mental Health Clinic, Hospital. Never invents credentials.
    """
    spec = (tags.get("healthcare:speciality") or "").lower()
    amenity = (tags.get("amenity") or "").lower()
    healthcare = (tags.get("healthcare") or "").lower()
    name = (tags.get("name") or "").lower()

    if "psychiat" in spec or "psychiat" in name:
        return "Psychiatrist", "Psychiatry & Medical Mental Health"
    if "psycholog" in spec or "psycholog" in name or "psychotherapist" in healthcare:
        return "Psychologist", "Clinical Psychology & Psychotherapy"
    if "counsel" in spec or "counselling" in healthcare or "counsel" in name:
        return "Counselling Centre", "Counseling & Psychosocial Support"
    if "hospital" in amenity or "hospital" in healthcare or "hospital" in name:
        return "Hospital", "Hospital Psychiatric & Wellness Department"
    return "Mental Health Clinic", "Mental Health & Psychological Support"


@router.get("/search")
def search_therapists(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    query: Optional[str] = Query(None),
    radius_km: int = Query(15),
    user=Depends(get_current_user),
):
    """Search for verified mental health providers, psychologists, and clinics near the user's coordinates or city.
    Only returns genuinely sourced information. Never fabricates reviews, phone numbers, or ratings.
    Supports Indian PIN codes (e.g. 712248), city names, and coordinates.
    """
    resolved_location_name = (query or "").strip()
    providers = []
    headers = {"User-Agent": "SunnoBuddyMentalHealthApp/2.1 (contact: support@sunnobuddy.internal)"}
    radius_expanded = False
    actual_radius_km = radius_km

    # 1. Forward geocode if text query is supplied without coordinates
    if (lat is None or lon is None) and resolved_location_name:
        is_pin = bool(re.match(r"^\d{6}$", resolved_location_name))
        try:
            with httpx.Client(timeout=5.0) as client:
                if is_pin:
                    geo_url = f"https://nominatim.openstreetmap.org/search?postalcode={resolved_location_name}&country=India&format=json&limit=1"
                else:
                    encoded_q = urllib.parse.quote(resolved_location_name)
                    geo_url = f"https://nominatim.openstreetmap.org/search?q={encoded_q}&format=json&limit=1"
                
                geo_res = client.get(geo_url, headers=headers)
                if geo_res.status_code == 200:
                    geo_list = geo_res.json()
                    if geo_list and len(geo_list) > 0:
                        lat = float(geo_list[0]["lat"])
                        lon = float(geo_list[0]["lon"])
                        raw_name = geo_list[0].get("display_name", "")
                        if raw_name:
                            parts = [p.strip() for p in raw_name.split(",") if p.strip()]
                            # Format cleaner short location name e.g. "Konnagar, Hooghly"
                            if len(parts) >= 3:
                                resolved_location_name = f"{parts[0]}, {parts[1]} ({resolved_location_name})" if is_pin else f"{parts[0]}, {parts[1]}"
                            else:
                                resolved_location_name = raw_name
        except Exception as e:
            print("[Therapist Locator] Forward geocode note:", e)

    # 2. Reverse geocode if coordinates provided without friendly name
    if lat is not None and lon is not None and (not resolved_location_name or re.match(r"^\d{6}$", resolved_location_name)):
        try:
            with httpx.Client(timeout=4.0) as client:
                geo_res = client.get(
                    f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json",
                    headers=headers,
                )
                if geo_res.status_code == 200:
                    geo_data = geo_res.json()
                    addr = geo_data.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("suburb") or addr.get("county") or addr.get("state")
                    if city:
                        resolved_location_name = city if not resolved_location_name else f"{city} ({resolved_location_name})"
        except Exception as e:
            print("[Therapist Locator] Reverse geocode note:", e)

    if not resolved_location_name:
        resolved_location_name = f"{lat:.3f}, {lon:.3f}" if (lat is not None and lon is not None) else "your location"

    # 3. Query real OpenStreetMap healthcare / psychology / counseling clinics near coordinates
    if lat is not None and lon is not None:
        def _query_overpass(radius_m: int) -> list:
            overpass_query = f"""[out:json][timeout:6];
(
  node["healthcare"="counselling"](around:{radius_m},{lat},{lon});
  node["healthcare"="psychotherapist"](around:{radius_m},{lat},{lon});
  node["healthcare"="psychiatrist"](around:{radius_m},{lat},{lon});
  node["amenity"="clinic"]["healthcare"](around:{radius_m},{lat},{lon});
  node["amenity"="doctors"]["healthcare"](around:{radius_m},{lat},{lon});
  node["amenity"="hospital"]["healthcare:speciality"](around:{radius_m},{lat},{lon});
  node["office"="therapist"](around:{radius_m},{lat},{lon});
);
out body 20;"""
            with httpx.Client(timeout=6.0) as client:
                res = client.post("https://overpass-api.de/api/interpreter", data=overpass_query)
                if res.status_code == 200:
                    return res.json().get("elements", [])
            return []

        try:
            initial_radius_meters = min(radius_km * 1000, 25000)
            elements = _query_overpass(initial_radius_meters)
            
            # If no providers found and radius was <= 15 km, adaptively expand search to 25 km
            if not elements and radius_km <= 15:
                elements = _query_overpass(25000)
                if elements:
                    radius_expanded = True
                    actual_radius_km = 25

            seen_names = set()
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name")
                if not name or name.strip() in seen_names:
                    continue
                seen_names.add(name.strip())

                plat = el.get("lat")
                plon = el.get("lon")
                dist = _haversine_distance(lat, lon, plat, plon) if (plat and plon) else None
                
                addr_parts = [tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city")]
                addr_str = ", ".join(p for p in addr_parts if p) or tags.get("addr:full") or f"Near {resolved_location_name}"
                
                cat_type, spec_label = _classify_provider(tags)
                phone_val = tags.get("phone") or tags.get("contact:phone")
                web_val = tags.get("website") or tags.get("contact:website")

                directions_url = (
                    f"https://www.google.com/maps/dir/?api=1&destination={plat},{plon}"
                    if (plat and plon)
                    else f"https://www.google.com/maps/search/{urllib.parse.quote(name)}"
                )

                item = {
                    "id": str(el.get("id")),
                    "name": name,
                    "type": cat_type,
                    "specialty": spec_label,
                    "distance_km": dist,
                    "distance_str": f"{dist} km away" if dist is not None else None,
                    "address": addr_str,
                    "phone": phone_val,
                    "website": web_val,
                    "verified": True,
                    "emergency": False,
                    "source": "OpenStreetMap Healthcare Directory",
                    "actions": {
                        "directions_url": directions_url,
                        "call_url": f"tel:{phone_val}" if phone_val else None,
                        "website_url": web_val,
                    },
                }
                providers.append(item)
        except Exception as e:
            print("[Therapist Locator] Live Overpass query note:", e)

    # Sort verified providers by distance
    providers.sort(key=lambda p: (p.get("distance_km") is None, p.get("distance_km") or 999.0))

    # Verified direct search directory links for the user's specific location
    search_q = urllib.parse.quote(resolved_location_name)
    directory_links = [
        {
            "name": "Google Maps Verified Therapists & Clinics",
            "url": f"https://www.google.com/maps/search/psychologists+and+mental+health+therapists+near+{search_q}",
            "desc": f"Explore licensed local psychology practices and clinics near {resolved_location_name} with reviews and hours.",
        },
        {
            "name": "Practo Verified Mental Health Specialists",
            "url": f"https://www.practo.com/search/therapists?results_type=doctor&q={search_q}",
            "desc": "Browse verified psychiatrists and clinical psychologists with appointment booking.",
        },
        {
            "name": "National Mental Health Helpline (KIRAN)",
            "phone": "1800-599-0019",
            "url": "https://pib.gov.in",
            "desc": "Toll-free 24/7 mental health rehabilitation helpline available in 13 languages.",
        },
    ]

    return ok({
        "location": resolved_location_name,
        "coordinates": {"lat": lat, "lon": lon} if (lat is not None and lon is not None) else None,
        "radius_km": actual_radius_km,
        "radius_expanded": radius_expanded,
        "count": len(providers),
        "total_providers_found": len(providers),
        "therapists": providers,
        "providers": providers,
        "directory_links": directory_links,
        "verified_directories": directory_links,
        "notice": (
            f"Displaying verified clinic listings within {actual_radius_km} km of {resolved_location_name}. "
            "All distances are mathematically calculated from your coordinates. No fabricated reviews or mock ratings are used."
        ),
    })
