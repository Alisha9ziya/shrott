import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://flutter-app-backend-1.onrender.com/api";

const STORAGE_TOKEN = "shrot_auth_token";
const STORAGE_USER = "shrot_auth_user";

const SOURCE_TYPES = ["well", "borewell", "river", "pond", "spring", "tap"];

const SOURCE_TYPE_COLORS = {
  well: "#2563eb",
  borewell: "#2563eb",
  river: "#2563eb",
  pond: "#2563eb",
  spring: "#2563eb",
  tap: "#2563eb",
};

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const DISTRICTS = {
  Delhi: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "South Delhi", "West Delhi"],
  Gujarat: ["Ahmedabad", "Gandhinagar", "Rajkot", "Surat", "Vadodara"],
  Karnataka: ["Bengaluru Urban", "Dharwad", "Mysuru", "Udupi"],
  Maharashtra: ["Mumbai City", "Nagpur", "Nashik", "Pune", "Thane"],
  Rajasthan: ["Ajmer", "Jaipur", "Jodhpur", "Kota", "Udaipur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Karimnagar", "Nizamabad", "Warangal"],
  "Uttar Pradesh": ["Agra", "Gorakhpur", "Lucknow", "Prayagraj", "Varanasi"],
  Uttarakhand: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Darjeeling", "Howrah", "Kolkata", "Malda", "Nadia"],
};

const EMPTY_SOURCE_FORM = { name: "", sourceType: "well", latitude: "", longitude: "", ph: "" };

const LOCAL_WATER_SOURCES = [
  { _id: "local-pauri-water-source", name: "Pauri Water Source", sourceType: "spring", latitude: 30.120913, longitude: 78.790788, village: "Pauri", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-toli-water-source", name: "Toli Water Source", sourceType: "spring", latitude: 30.037434, longitude: 78.792795, village: "Toli", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-unchar-water-source-1", name: "Unchar Water Source 1", sourceType: "spring", latitude: 30.17661, longitude: 78.690693, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall" },
  { _id: "local-unchar-water-source-2", name: "Unchar Water Source 2", sourceType: "spring", latitude: 30.17875, longitude: 78.688112, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall" },
  { _id: "local-unchar-water-source-3", name: "Unchar Water Source 3", sourceType: "spring", latitude: 30.180508, longitude: 78.684133, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall" },
  { _id: "local-khanda-water-source-1", name: "Khanda Water Source 1", sourceType: "spring", latitude: 30.16827, longitude: 78.684792, village: "Khanda", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-kandol-gaon-water-source", name: "Kandol Gaon Water Source", sourceType: "spring", latitude: 30.166023, longitude: 78.676615, village: "Kandol Gaon", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-kanda-water-source-2", name: "Kanda Water Source 2", sourceType: "spring", latitude: 30.166678, longitude: 78.673322, village: "Kanda", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-qurali-water-source", name: "Qurali Water Source", sourceType: "spring", latitude: 30.151617, longitude: 78.619135, village: "Qurali", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-ujiyari-water-source", name: "Ujiyari Water Source", sourceType: "spring", latitude: 30.156012, longitude: 78.739787, village: "Ujiyari", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Spring / Waterfall" },
  { _id: "local-khar-kota-water-source", name: "Khar Kota Water Source", sourceType: "spring", latitude: 30.13605, longitude: 78.77257, village: "Pauri", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-praniya-walla-water-source", name: "Praniya Walla Water Source", sourceType: "spring", latitude: 30.190959, longitude: 78.684719, village: "Praniya Walla", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-unchar-waterfall-a", name: "Unchar Waterfall Source A", sourceType: "spring", latitude: 30.180637, longitude: 78.684167, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-unchar-spring-b", name: "Unchar Spring Source B", sourceType: "spring", latitude: 30.178951, longitude: 78.687563, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-unchar-waterfall-c", name: "Unchar Waterfall Source C", sourceType: "spring", latitude: 30.176563, longitude: 78.690818, village: "Unchar", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall" },
  { _id: "local-kandol-gaon-temple-source", name: "Kandol Gaon Temple Source", sourceType: "spring", latitude: 30.166791, longitude: 78.677714, village: "Kandol Gaon", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Spring near temple" },
  { _id: "local-dandapani-water-source", name: "Dandapani Water Source", sourceType: "spring", latitude: 30.172195, longitude: 78.68951, village: "Dandapani", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },
  { _id: "local-khanda-water-source-new", name: "Khanda Water Source", sourceType: "spring", latitude: 30.169773, longitude: 78.6871, village: "Khanda", district: "Pauri Garhwal", state: "Uttarakhand", notes: "Natural Waterfall / Spring" },

];

const TEAM_SUPERVISORS = [
  { name: "Dr. Pushkar Praveen", role: "Principal Investigator" },
  { name: "Dr. Agya Ram Verma", role: "Co-Principal Investigator" },
  { name: "Dr. Papendra Kumar", role: "Co-Principal Investigator" },
];

const TEAM_MEMBERS = [
  { name: "Abhishek Pokhriyal", role: "Hardware & IoT" },
  { name: "Alisha Ziya Kavish", role: "Software Development" },
  { name: "Meet Chauhan", role: "Research & Analysis" },
];

const GALLERY_PHOTOS = [
  { src: "/res1.png", title: "Kanda Water Source", caption: "Kanda, Uttarakhand — natural spring, 30.1667° N, 78.6733° E" },
  { src: "/res2.png", title: "Unchar Water Source", caption: "Unchar, Uttarakhand — natural waterfall, 30.1766° N, 78.6907° E" },
  { src: "/res3.png", title: "Praniya Walla Spring", caption: "Praniya Walla, Uttarakhand — natural spring, 30.1910° N, 78.6847° E" },
  { src: "/unchar-waterfall-a.jpg", title: "Unchar Waterfall Source A", caption: "Unchar, Uttarakhand — natural waterfall, 30.1806° N, 78.6842° E" },
  { src: "/kandol-gaon-temple.jpg", title: "Kandol Gaon Temple Source", caption: "Kandol Gaon, Uttarakhand — natural spring near temple, 30.1668° N, 78.6777° E" },
  { src: "/dandapani-source.jpg", title: "Dandapani Water Source", caption: "Dandapani, Uttarakhand — natural waterfall / spring, 30.1722° N, 78.6895° E" },
]
const TILE_SIZE = 256;
const INDIA_CENTER = { latitude: 22.5937, longitude: 78.9629 };
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function clampLatitude(lat) { return Math.max(-85, Math.min(85, lat)); }
function wrapLongitude(lng) {
  if (!Number.isFinite(lng)) return INDIA_CENTER.longitude;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function latLngToWorld(latitude, longitude, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = clampLatitude(latitude);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((wrapLongitude(longitude) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { latitude: clampLatitude(latitude), longitude: wrapLongitude(longitude) };
}

function readSavedUser() {
  try { const raw = localStorage.getItem(STORAGE_USER); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function cleanError(error, fallback = "Something went wrong") {
  if (!error) return fallback;
  return String(error).replace(/^Error:\s*/, "") || fallback;
}

function sourceCoords(source) {
  const coords = source?.location?.coordinates;
  return {
    longitude: Array.isArray(coords) && coords.length > 0 ? Number(coords[0]) : Number(source?.longitude || 0),
    latitude: Array.isArray(coords) && coords.length > 1 ? Number(coords[1]) : Number(source?.latitude || 0),
  };
}

function districtFromAddress(address = {}) {
  return address.state_district || address.county || address.city_district ||
    address.district || address.city || address.town || address.village || "";
}

function formatSearchResult(item) {
  const address = item.address || {};
  return {
    id: item.place_id,
    name: item.name || item.display_name?.split(",")[0] || "Selected location",
    displayName: item.display_name || "Selected location",
    district: districtFromAddress(address),
    state: address.state || "",
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  };
}

function detailFields(source) {
  const { latitude, longitude } = sourceCoords(source);
  return [
    ["ID", source._id || source.id || "N/A"],
    ["Name", source.name || "Unnamed source"],
    ["Latitude", Number.isFinite(latitude) ? latitude.toFixed(6) : "N/A"],
    ["Longitude", Number.isFinite(longitude) ? longitude.toFixed(6) : "N/A"],
    ["pH", source.ph ?? "N/A"],
    ["Source Type", source.sourceType || "N/A"],
    ["Village", source.village || "N/A"],
    ["District", source.district || "N/A"],
    ["State", source.state || "N/A"],
    ["Potable", source.isPotable == null ? "N/A" : source.isPotable ? "Yes" : "No"],
    ["Seasonal", source.seasonal == null ? "N/A" : source.seasonal ? "Yes" : "No"],
    ["Users / Day", source.usersPerDay ?? "N/A"],
    ["Condition", source.condition || "N/A"],
    ["Quality Status", source.qualityStatus || "N/A"],
    ["Address", source.address || "N/A"],
    ["Notes", source.notes || "N/A"],
    ["Created At", source.createdAt ? new Date(source.createdAt).toLocaleString() : "N/A"],
  ];
}

function mergeSources(apiSources = []) {
  const existingNames = new Set(apiSources.map((s) => s?.name?.trim().toLowerCase()).filter(Boolean));
  const extras = LOCAL_WATER_SOURCES.filter((s) => !existingNames.has(s.name.trim().toLowerCase()));
  return [...apiSources, ...extras];
}

async function request(path, { token, timeoutMs = 15000, ...options } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError")
      throw new Error("The server is taking too long to respond (it may be waking up from sleep). Showing local data for now.");
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function DropIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const mapRef = useRef(null);
  const dragRef = useRef(null);

  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [user, setUser] = useState(readSavedUser);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(STORAGE_TOKEN)));
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionState, setRegionState] = useState(user?.state || "");
  const [regionDistrict, setRegionDistrict] = useState(user?.district || "");
  const [regionBusy, setRegionBusy] = useState(false);
  const [sources, setSources] = useState(() => LOCAL_WATER_SOURCES);
  const [sourcesBusy, setSourcesBusy] = useState(false);
  const [sourcesError, setSourcesError] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceEditor, setSourceEditor] = useState(null);
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE_FORM);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [searchedPoint, setSearchedPoint] = useState(null);
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState(user?.district || "");
  const [filterType, setFilterType] = useState("");
  const [districtFilter, setDistrictFilter] = useState(user?.district || "");
  const [mapSize, setMapSize] = useState({ width: 900, height: 560 });
  const [mapTouched, setMapTouched] = useState(false);
  const [mapView, setMapView] = useState({ ...INDIA_CENTER, zoom: 5 });
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [galleryZoom, setGalleryZoom] = useState(null);

  const isLoggedIn = Boolean(token && user);
  const stateDistricts = DISTRICTS[regionState] || [];
  const filterStateDistricts = DISTRICTS[filterState] || [];

  const filteredSources = useMemo(() => {
    let result = sources;
    const needle = query.trim().toLowerCase();
    if (needle) {
      result = result.filter((s) =>
        [s.name, s.sourceType, s.village, s.district, s.state]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      );
    }
    if (filterState) result = result.filter((s) => (s.state || "").toLowerCase() === filterState.toLowerCase());
    if (filterDistrict) result = result.filter((s) => (s.district || "").trim().toLowerCase() === filterDistrict.trim().toLowerCase());
    if (filterType) result = result.filter((s) => (s.sourceType || "") === filterType);
    return result;
  }, [query, sources, filterState, filterDistrict, filterType]);

  const tileLayout = useMemo(() => {
    const zoom = mapView.zoom;
    const center = latLngToWorld(mapView.latitude, mapView.longitude, zoom);
    const left = center.x - mapSize.width / 2;
    const top = center.y - mapSize.height / 2;
    const minX = Math.floor(left / TILE_SIZE);
    const maxX = Math.floor((left + mapSize.width) / TILE_SIZE);
    const minY = Math.floor(top / TILE_SIZE);
    const maxY = Math.floor((top + mapSize.height) / TILE_SIZE);
    const worldTiles = 2 ** zoom;
    const tiles = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y < 0 || y >= worldTiles) continue;
        const wrappedX = ((x % worldTiles) + worldTiles) % worldTiles;
        tiles.push({
          key: `${zoom}-${x}-${y}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - left,
          top: y * TILE_SIZE - top,
        });
      }
    }
    return { center, left, top, tiles, zoom };
  }, [mapSize.height, mapSize.width, mapView.latitude, mapView.longitude, mapView.zoom]);

  const projectedSources = useMemo(() =>
    filteredSources.map((source) => {
      const { latitude, longitude } = sourceCoords(source);
      const point = latLngToWorld(latitude, longitude, tileLayout.zoom);
      return { source, left: point.x - tileLayout.left, top: point.y - tileLayout.top };
    }),
    [filteredSources, tileLayout.left, tileLayout.top, tileLayout.zoom]
  );

  const projectedSelectedPoint = useMemo(() => {
    if (!selectedPoint) return null;
    const point = latLngToWorld(selectedPoint.latitude, selectedPoint.longitude, tileLayout.zoom);
    return { left: point.x - tileLayout.left, top: point.y - tileLayout.top };
  }, [selectedPoint, tileLayout.left, tileLayout.top, tileLayout.zoom]);

  const projectedSearchedPoint = useMemo(() => {
    if (!searchedPoint) return null;
    const point = latLngToWorld(searchedPoint.latitude, searchedPoint.longitude, tileLayout.zoom);
    return { left: point.x - tileLayout.left, top: point.y - tileLayout.top };
  }, [searchedPoint, tileLayout.left, tileLayout.top, tileLayout.zoom]);

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_TOKEN, nextToken);
    localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setSources([]);
    setSelectedSource(null);
    setSourceEditor(null);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }, []);

  const loadSources = useCallback(async (district = "") => {
    setSourcesBusy(true);
    setSourcesError("");
    try {
      const path = district
        ? `/water-sources?district=${encodeURIComponent(district)}`
        : "/water-sources";
      const data = await request(path);
      const apiSources = Array.isArray(data) ? data : data?.data || [];
      const combined = mergeSources(apiSources);
      const visible = district
        ? combined.filter((s) => (s.district || "").trim().toLowerCase() === district.trim().toLowerCase())
        : combined;
      setSources(visible);
    } catch (error) {
      const fallback = district
        ? LOCAL_WATER_SOURCES.filter((s) => (s.district || "").trim().toLowerCase() === district.trim().toLowerCase())
        : LOCAL_WATER_SOURCES;
      setSources(fallback);
      setSourcesError(cleanError(error, "Failed to load sources"));
    } finally {
      setSourcesBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { setBooting(false); return; }
    let cancelled = false;
    request("/auth/me", { token })
      .then((body) => {
        if (cancelled) return;
        persistSession(token, body.user);
        setRegionState(body.user?.state || "");
        setRegionDistrict(body.user?.district || "");
        setDistrictFilter(body.user?.district || "");
        setFilterDistrict(body.user?.district || "");
      })
      .catch(() => { if (!cancelled) logout(); })
      .finally(() => { if (!cancelled) setBooting(false); });
    return () => { cancelled = true; };
  }, [logout, persistSession, token]);

  useEffect(() => { loadSources(user?.district || ""); }, [loadSources, user?.district]);

  // Re-attach the observer whenever the map is (re)mounted — i.e. when the
  // splash ends or the user switches between Home and Resources.
  useEffect(() => {
    if (!mapRef.current) return;
    const el = mapRef.current;
    const measure = (rect) =>
      setMapSize({ width: Math.max(320, rect.width), height: Math.max(360, rect.height) });
    measure(el.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect));
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeSection, booting]);

  useEffect(() => {
    if (mapTouched || filteredSources.length === 0) return;
    const { latitude, longitude } = sourceCoords(filteredSources[0]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setMapView({ latitude, longitude, zoom: districtFilter ? 10 : 5 });
  }, [districtFilter, filteredSources, mapTouched]);

  const anyModalOpen = Boolean(selectedSource || sourceEditor || authOpen || regionOpen || galleryZoom);
  useEffect(() => {
    if (!anyModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [anyModalOpen]);

  function updateAuthField(field, value) { setAuthForm((c) => ({ ...c, [field]: value })); }

  function goToSection(id) {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const body = await request(path, { method: "POST", body: JSON.stringify(authForm) });
      persistSession(body.token, body.user);
      setRegionState(body.user?.state || "");
      setRegionDistrict(body.user?.district || "");
      setDistrictFilter(body.user?.district || "");
      setFilterDistrict(body.user?.district || "");
      setAuthOpen(false);
      if (!body.user?.regionCompleted || !body.user?.state || !body.user?.district) setRegionOpen(true);
    } catch (error) {
      setAuthError(cleanError(error, "Authentication failed"));
    } finally {
      setAuthBusy(false);
    }
  }

  async function saveRegion(e) {
    e.preventDefault();
    setRegionBusy(true);
    setAuthError("");
    try {
      const body = await request("/auth/region", {
        method: "PATCH",
        token,
        body: JSON.stringify({ state: regionState, district: regionDistrict }),
      });
      persistSession(token, body.user);
      setDistrictFilter(body.user.district);
      setFilterDistrict(body.user.district);
      setRegionOpen(false);
    } catch (error) {
      setAuthError(cleanError(error, "Could not save region"));
    } finally {
      setRegionBusy(false);
    }
  }

  async function searchLocation(e) {
    e.preventDefault();
    const text = locationQuery.trim();
    if (!text || locationSearching) return;

    setLocationSearching(true);
    setLocationError("");
    setLocationResults([]);
    try {
      const params = new URLSearchParams({ q: text, format: "jsonv2", addressdetails: "1", limit: "6", countrycodes: "in" });
      const res = await fetch(`${NOMINATIM_URL}?${params}`);
      if (!res.ok) throw new Error("Could not search locations");
      const data = await res.json();
      const results = Array.isArray(data)
        ? data.map(formatSearchResult).filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
        : [];
      setLocationResults(results);
      setLocationError(results.length ? "" : "No locations found");
    } catch (error) {
      setLocationError(cleanError(error, "Could not search locations"));
    } finally {
      setLocationSearching(false);
    }
  }

  async function selectLocation(result) {
    setLocationQuery(result.name);
    setLocationResults([]);
    setLocationError("");
    setSearchedPoint({ latitude: result.latitude, longitude: result.longitude, name: result.name });
    setMapTouched(true);
    setMapView({ latitude: result.latitude, longitude: result.longitude, zoom: 14 });
    if (result.district) {
      setDistrictFilter(result.district);
      setFilterDistrict(result.district);
      await loadSources(result.district);
    }
  }

  async function moveToUserRegion() {
    const district = user?.district || districtFilter;
    const state = user?.state || "";
    const text = [district, state, "India"].filter(Boolean).join(", ");
    if (!text) return;
    setLocationQuery(text);
    setLocationSearching(true);
    setLocationError("");
    try {
      const params = new URLSearchParams({ q: text, format: "jsonv2", addressdetails: "1", limit: "1", countrycodes: "in" });
      const res = await fetch(`${NOMINATIM_URL}?${params}`);
      if (!res.ok) throw new Error("Could not find region");
      const [first] = await res.json();
      if (!first) throw new Error("Could not find region");
      const result = formatSearchResult(first);
      setMapTouched(true);
      setMapView({ latitude: result.latitude, longitude: result.longitude, zoom: district ? 11 : 7 });
    } catch (error) {
      setLocationError(cleanError(error, "Could not find region"));
    } finally {
      setLocationSearching(false);
    }
  }

  function openAddSource(point = selectedPoint) {
    setSelectedSource(null);
    setSourceEditor("add");
    setSourceError("");
    setSourceForm({
      ...EMPTY_SOURCE_FORM,
      latitude: point?.latitude ? point.latitude.toFixed(6) : "",
      longitude: point?.longitude ? point.longitude.toFixed(6) : "",
    });
  }

  function openEditSource(source) {
    const { latitude, longitude } = sourceCoords(source);
    setSelectedSource(null);
    setSourceEditor(source);
    setSourceError("");
    setSourceForm({
      name: source.name || "",
      sourceType: source.sourceType || "well",
      latitude: Number.isFinite(latitude) ? latitude.toFixed(6) : "",
      longitude: Number.isFinite(longitude) ? longitude.toFixed(6) : "",
      ph: source.ph ?? "",
    });
  }

  function focusSource(source) {
    const { latitude, longitude } = sourceCoords(source);
    setMapTouched(true);
    setMapView({ latitude, longitude, zoom: Math.max(mapView.zoom, 14) });
    setSelectedSource(source);
  }

  function updateSourceField(field, value) { setSourceForm((c) => ({ ...c, [field]: value })); }

  async function submitSource(e) {
    e.preventDefault();
    setSourceBusy(true);
    setSourceError("");

    const payload = {
      name: sourceForm.name.trim(),
      sourceType: sourceForm.sourceType,
      latitude: Number(sourceForm.latitude),
      longitude: Number(sourceForm.longitude),
      state: user?.state,
      district: user?.district,
    };

    if (sourceForm.ph !== "") payload.ph = Number(sourceForm.ph);

    try {
      const isEditing = sourceEditor && sourceEditor !== "add";
      await request(
        isEditing ? `/water-sources/${sourceEditor._id || sourceEditor.id}` : "/water-sources/add",
        { method: isEditing ? "PATCH" : "POST", token, body: JSON.stringify(payload) }
      );
      setSourceEditor(null);
      setSelectedPoint(null);
      await loadSources(districtFilter);
    } catch (error) {
      setSourceError(cleanError(error, "Could not save source"));
    } finally {
      setSourceBusy(false);
    }
  }

  function pickMapPoint(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const worldX = tileLayout.left + (e.clientX - rect.left);
    const worldY = tileLayout.top + (e.clientY - rect.top);
    setSelectedPoint(worldToLatLng(worldX, worldY, mapView.zoom));
  }

  function beginMapDrag(e) {
    if (e.button !== 0) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      center: latLngToWorld(mapView.latitude, mapView.longitude, mapView.zoom),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moveMapDrag(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { drag.moved = true; setMapTouched(true); }
    setMapView((c) => ({
      ...c,
      ...worldToLatLng(drag.center.x - dx, drag.center.y - dy, mapView.zoom),
    }));
  }

  function endMapDrag() { window.setTimeout(() => { dragRef.current = null; }, 0); }

  function zoomMap(delta, anchor) {
    setMapTouched(true);
    setMapView((current) => {
      const nextZoom = Math.max(3, Math.min(18, current.zoom + delta));
      if (nextZoom === current.zoom) return current;
      if (!anchor) return { ...current, zoom: nextZoom };
      const centerWorld = latLngToWorld(current.latitude, current.longitude, current.zoom);
      const topLeft = { x: centerWorld.x - mapSize.width / 2, y: centerWorld.y - mapSize.height / 2 };
      const anchorWorld = { x: topLeft.x + anchor.x, y: topLeft.y + anchor.y };
      const anchorLL = worldToLatLng(anchorWorld.x, anchorWorld.y, current.zoom);
      const anchorNext = latLngToWorld(anchorLL.latitude, anchorLL.longitude, nextZoom);
      const nextCenter = {
        x: anchorNext.x - anchor.x + mapSize.width / 2,
        y: anchorNext.y - anchor.y + mapSize.height / 2,
      };
      return { ...worldToLatLng(nextCenter.x, nextCenter.y, nextZoom), zoom: nextZoom };
    });
  }

  function handleMapWheel(e) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    zoomMap(e.deltaY < 0 ? 1 : -1, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function applyFilters(e) {
    e.preventDefault();
    setDistrictFilter(filterDistrict);
    loadSources(filterDistrict);
  }

  function clearFilters() {
    setFilterState("");
    setFilterDistrict("");
    setFilterType("");
    setQuery("");
    setDistrictFilter("");
    loadSources("");
  }

  // ─── Splash ─────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="splash">
        <div className="splash-logo">
          <DropIcon size={52} color="#16a34a" />
        </div>
        <h1 className="splash-title">JalSrot</h1>
        <p className="splash-sub">Water Sources for a Sustainable Tomorrow</p>
      </div>
    );
  }

  // ─── Shared explorer (filters + map + list) used on Home AND Resources ───
  const explorer = (
    <div
      className={`main-layout${activeSection === "home" ? " home-no-map" : ""}`}
      style={activeSection === "home" ? { gridTemplateColumns: "200px minmax(0, 1fr)" } : undefined}
    >

      {/* LEFT — Filter Sidebar */}
      <aside className="filter-panel">
        <h3 className="filter-heading">Find Water Sources</h3>
        <form onSubmit={applyFilters}>
          <div className="filter-search-box">
            <SearchIcon />
            <input
              className="filter-search-input"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, location..."
              value={query}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">State / UT</label>
            <select
              className="filter-select"
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(""); }}
            >
              <option value="">All States</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">District</label>
            <select
              className="filter-select"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {filterStateDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              {filterDistrict && !filterStateDistricts.includes(filterDistrict) && (
                <option value={filterDistrict}>{filterDistrict}</option>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Resource Type</label>
            <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <button className="filter-search-btn" disabled={sourcesBusy} type="submit">
            <SearchIcon /> {sourcesBusy ? "Searching..." : "Search Sources"}
          </button>
        </form>

        <button className="filter-clear-btn" onClick={clearFilters} type="button">↺ Clear Filters</button>

        {isLoggedIn && (
          <div className="filter-user-section">
            <div className="filter-user-avatar">{user.email?.[0]?.toUpperCase() || "S"}</div>
            <span className="filter-user-email">{user.email}</span>
            <button className="filter-add-btn" onClick={() => openAddSource()} type="button">
              + Add Source
            </button>
          </div>
        )}
      </aside>

      {/* CENTER — Map (hidden on the Home page; available in Resources) */}
      {activeSection !== "home" && (
        <section className="map-section">
          <div className="map-bar">
            <form className="map-search-form" onSubmit={searchLocation}>
              <div className="map-search-wrap">
                <SearchIcon />
                <input
                  className="map-search-input"
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search a location"
                  value={locationQuery}
                />
              </div>
              <button className="map-search-btn" disabled={locationSearching} type="submit">
                {locationSearching ? "Searching..." : "Search"}
              </button>
            </form>
            <button className="map-region-btn" onClick={moveToUserRegion} type="button">My region</button>
            {selectedPoint && (
              <button className="map-use-btn" onClick={() => openAddSource()} type="button">Use picked point</button>
            )}
          </div>

          {(locationResults.length > 0 || locationError) && (
            <div className="location-results">
              {locationError && <p className="location-error">{locationError}</p>}
              {locationResults.map((r) => (
                <button key={r.id} className="location-result-item" onClick={() => selectLocation(r)} type="button">
                  <strong>{r.name}</strong>
                  <span>{r.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {sourcesError && <div className="error-banner">{sourcesError}</div>}

          <div
            className="map-canvas"
            onClick={(e) => { if (dragRef.current?.moved) return; pickMapPoint(e); }}
            onPointerDown={beginMapDrag}
            onPointerMove={moveMapDrag}
            onPointerUp={endMapDrag}
            onPointerCancel={endMapDrag}
            onWheel={handleMapWheel}
            ref={mapRef}
            role="presentation"
          >
            <div className="tile-layer">
              {tileLayout.tiles.map((tile) => (
                <img
                  alt=""
                  className="map-tile"
                  draggable="false"
                  key={tile.key}
                  src={tile.src}
                  style={{ left: tile.left, top: tile.top }}
                />
              ))}
            </div>

            {sourcesBusy && <div className="loading-pill">Loading sources…</div>}

            <div className="map-controls">
              <button onClick={(e) => { e.stopPropagation(); zoomMap(1); }} onPointerDown={(e) => e.stopPropagation()} type="button">+</button>
              <button onClick={(e) => { e.stopPropagation(); zoomMap(-1); }} onPointerDown={(e) => e.stopPropagation()} type="button">−</button>
            </div>

            {projectedSearchedPoint && (
              <button
                className="map-pin search-pin"
                onClick={(e) => e.stopPropagation()}
                style={projectedSearchedPoint}
                title={searchedPoint?.name}
                type="button"
              >
                <span className="search-dot" />
              </button>
            )}

            {projectedSources.map(({ source, left, top }) => {
              const color = SOURCE_TYPE_COLORS[source.sourceType] || "#6b7280";
              return (
                <button
                  className="map-dot-pin"
                  key={source._id || source.id || source.name}
                  onClick={(e) => { e.stopPropagation(); setSelectedSource(source); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ left, top }}
                  title={source.name}
                  type="button"
                >
                  <span className="dot-circle" style={{ background: color }} />
                </button>
              );
            })}

            {selectedPoint && (
              <button
                className="map-pin add-pin"
                onClick={(e) => { e.stopPropagation(); openAddSource(selectedPoint); }}
                style={projectedSelectedPoint}
                type="button"
              >
                <span>+</span>
              </button>
            )}

            <div className="map-legend">
              {SOURCE_TYPES
                .filter((t) => t !== "well" && t !== "borewell")
                .map((t) => (
                  <span key={t} className="legend-item">
                    <span className="legend-dot" style={{ background: SOURCE_TYPE_COLORS[t] }} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                ))}
            </div>

            <a className="map-attribution" href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
              Leaflet | © OpenStreetMap contributors
            </a>
          </div>
        </section>
      )}

      {/* RIGHT — Source list */}
      <aside className="source-panel">
        <div className="source-panel-header">
          <h3>Water Sources</h3>
          <span className="source-count">{filteredSources.length} sources</span>
        </div>
        <div className="source-list-scroll">
          {filteredSources.length === 0 && (
            <p className="empty-state">{sourcesBusy ? "Loading…" : "No water sources found."}</p>
          )}
          {filteredSources.map((source) => {
            const { latitude, longitude } = sourceCoords(source);
            const color = SOURCE_TYPE_COLORS[source.sourceType] || "#6b7280";
            return (
              <button
                className="source-card"
                key={source._id || source.id || source.name}
                onClick={() => focusSource(source)}
                type="button"
              >
                <div className="source-card-dot" style={{ background: color }} />
                <div className="source-card-body">
                  <strong className="source-card-name">{source.name || "Unnamed source"}</strong>
                  <span className="source-card-meta">
                    <span className="source-badge" style={{ background: `${color}22`, color }}>
                      {source.sourceType || "source"}
                    </span>
                    {source.district || "N/A"}{source.state ? `, ${source.state}` : ""}
                  </span>
                  <span className="source-card-coords">
                    {Number.isFinite(latitude) ? latitude.toFixed(3) : "N/A"},{" "}
                    {Number.isFinite(longitude) ? longitude.toFixed(3) : "N/A"}
                  </span>
                </div>
                <span className="source-card-chevron">›</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );

  // ─── Main render ────────────────────────────────────────────────────────
  return (
    <div className={`app-root${darkMode ? " dark" : ""}`}>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <DropIcon size={28} color="#16a34a" />
          <span className="brand-name">JalSrot</span>
        </div>
        <div className="navbar-links">
          {[
            ["home", "Home"],
            ["about", "About"],
            ["resources", "Water Sources"],
            ["contributions", "Research Team"],
            ["gallery", "Gallery"],
            ["contact", "Contact & Support"],
          ].map(([id, label]) => (
            <button
              className={`nav-link${activeSection === id ? " active" : ""}`}
              key={id}
              onClick={() => goToSection(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="navbar-actions">
          <button className="icon-btn" onClick={() => setDarkMode((d) => !d)} title="Toggle theme" type="button">
            {darkMode ? "☀" : "🌙"}
          </button>
          {isLoggedIn ? (
            <>
              <button
                className="nav-btn ghost"
                onClick={() => { setRegionState(user.state || ""); setRegionDistrict(user.district || ""); setRegionOpen(true); }}
                type="button"
              >
                📍 {user.district || "Region"}
              </button>
              <button className="nav-btn ghost" onClick={logout} type="button">Sign out</button>
            </>
          ) : (
            <button
              className="nav-btn primary"
              onClick={() => { setAuthMode("login"); setAuthOpen(true); }}
              type="button"
            >
              👤 Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── HOME ────────────────────────────────────────────────────── */}
      {activeSection === "home" && (
        <div className="home-view" id="home">
          <section className="hero">
            <img className="hero-bg-image" src="/image.png" alt="" />
            <div className="hero-overlay" />
            <div className="hero-text">
              <h1 className="hero-title">
                Discover and Protect Our <span className="hero-accent">Water Sources</span>
              </h1>
              <p className="hero-subtitle">
                Find, verify, and help map natural water sources near you.
              </p>
            </div>
          </section>

          {/* ── HOME PROJECT INFORMATION ───────────────────────────── */}
          <section className="home-project-content">

            <div className="home-intro">
              <span className="home-label">UCOST FUNDED RESEARCH PROJECT</span>

              <h2>
                Building a Sustainable and
                <span> Resilient Water Future</span>
              </h2>

              <p>
                Smart and Sustainable Water Resource Management for Himalayan
                Communities and Downstream Resilience in Uttarakhand.
              </p>

              <p className="home-institute">
                A UCOST-funded research project at G.B. Pant Institute of
                Engineering & Technology, Pauri Garhwal, Uttarakhand
              </p>

              <p>
                The “Smart and Sustainable Water Resource Management for
                Himalayan Communities and Downstream Resilience in
                Uttarakhand” is a one-year research project sanctioned by
                the Uttarakhand State Council for Science and Technology
                (UCOST), Government of Uttarakhand.
              </p>

              <p>
                The project is being implemented at G.B. Pant Institute of
                Engineering & Technology, Pauri Garhwal, Uttarakhand, under
                the leadership of Dr. Pushkar Praveen, Principal
                Investigator, with Dr. Agya Ram Verma and Dr. Papendra
                Kumar serving as Co-Principal Investigators.
              </p>

              <p>
                The project focuses on the theme of smart and sustainable
                water resource management, with particular emphasis on
                Himalayan communities and downstream resilience in
                Uttarakhand.
              </p>

              <div className="home-actions">
                <button
                  className="home-primary-btn"
                  onClick={() => goToSection("resources")}
                  type="button"
                >
                  Explore Water Sources →
                </button>

                <button
                  className="home-secondary-btn"
                  onClick={() => goToSection("about")}
                  type="button"
                >
                  Learn About the Project
                </button>
              </div>
            </div>

            <div className="home-focus-section">
              <div className="home-section-heading">
                <span>OUR FOCUS</span>
                <h2>Working Towards Water Resilience</h2>
                <p>
                  Our project focuses on smart management, sustainability and
                  resilience of Himalayan water resources.
                </p>
              </div>

              <div className="home-focus-grid">

                <div className="home-focus-card">
                  <div className="home-card-icon">💧</div>
                  <h3>Smart Water Resource Management</h3>
                  <p>
                    Exploring approaches toward smarter management of water
                    resources in the Himalayan context.
                  </p>
                </div>

                <div className="home-focus-card">
                  <div className="home-card-icon">🌱</div>
                  <h3>Sustainable Water Resources</h3>
                  <p>
                    Promoting a long-term perspective on the sustainable
                    management of water resources.
                  </p>
                </div>

                <div className="home-focus-card">
                  <div className="home-card-icon">🏔️</div>
                  <h3>Himalayan Communities</h3>
                  <p>
                    Recognizing the importance of sustainable water resources
                    for communities in the Himalayan region.
                  </p>
                </div>

                <div className="home-focus-card">
                  <div className="home-card-icon">🌊</div>
                  <h3>Downstream Resilience</h3>
                  <p>
                    Considering the broader importance of water-resource
                    resilience for downstream regions.
                  </p>
                </div>

              </div>
            </div>

            <div className="home-bottom-banner">
              <div>
                <h3>Discover. Document. Protect.</h3>
                <p>
                  Help build awareness and support sustainable water resource
                  management.
                </p>
              </div>

              <button
                className="home-primary-btn"
                onClick={() => goToSection("resources")}
                type="button"
              >
                View Resources →
              </button>
            </div>

          </section>
        </div>
      )}

      {/* ── Water Sources ─────────────────────────────── */}
      {activeSection === "resources" && (
        <div className="resources-fullview" id="resources">
          <div className="resources-page-header">
            <h2 className="resources-page-title">Water Sources</h2>
            <span className="resources-page-count">{sources.length} sources</span>
          </div>
          {explorer}
        </div>
      )}

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      {activeSection === "about" && (
        <section className="page-section view-page" id="about">

          <h2 className="section-heading">
            About the Project
          </h2>

          <p className="section-sub">
            Water resources in the Himalayan region are closely connected
            with the well-being of communities as well as downstream areas.
            The sanctioned project,{" "}
            <strong>
              “Smart and Sustainable Water Resource Management for
              Himalayan Communities and Downstream Resilience in Uttarakhand,”
            </strong>{" "}
            focuses on managing water resources sustainably while
            considering the needs of Himalayan communities and downstream
            resilience.
          </p>

          <p className="section-sub">
            The project is being undertaken at{" "}
            <strong>
              G.B. Pant Institute of Engineering & Technology,
              Pauri Garhwal, Uttarakhand,
            </strong>{" "}
            with financial support from{" "}
            <strong>UCOST, Government of Uttarakhand.</strong>
          </p>

          <p className="section-sub">
            The project is led by{" "}
            <strong>
              Dr. Pushkar Praveen, Principal Investigator,
            </strong>{" "}
            with <strong>Dr. Agya Ram Verma</strong> and{" "}
            <strong>Dr. Papendra Kumar</strong> serving as{" "}
            <strong>Co-Principal Investigators.</strong>
          </p>

          {/* PROJECT VISION */}
          <h3 className="about-heading">
            Project Vision
          </h3>

          <p className="section-sub">
            To support sustainable and smart water resource management
            approaches that contribute to resilient Himalayan communities
            and strengthen downstream water-resource resilience in
            Uttarakhand.
          </p>

          {/* WHY THIS PROJECT MATTERS */}
          <h3 className="about-heading">
            Why This Project Matters
          </h3>

          <p className="section-sub">
            The project title itself identifies two interconnected areas of concern
          </p>

          <div className="about-info-block">
            <h4>Himalayan Communities</h4>
            <p className="section-sub">
              Water resources are important for life and development
              in Himalayan communities. Sustainable management of these
              resources supports community resilience.
            </p>
          </div>

          <div className="about-info-block">
            <h4>Downstream Resilience</h4>
            <p className="section-sub">
              Water-resource conditions in Himalayan regions have impliacations beyond the immediate communities.The project consequently considers <b>downstream resillience</b> as part of its broader focus
              areas beyond immediate communities. The project therefore
              considers downstream resilience.
            </p>
          </div>

          <div className="about-info-block">
            <h4>Smart & Sustainable Management</h4>
            <p className="section-sub">
             The project specifically emphasizes<b>“Smart and Sustainable Water Resource Management,”</b>  indicating a focus on approaches that combine improved management with long-term sustainability
            </p>
          </div>

          {/* PROJECT OBJECTIVES */}
          <div className="about-objectives-section">
            <h3 className="about-heading">
              Project Objectives
            </h3>

            <ul className="about-objectives">
              <li>
                To explore smart approaches for improved water resource
                management.
              </li>

              <li>
                To consider the water-resource needs and resilience of
                Himalayan communities.
              </li>
            </ul>
          </div>

        </section>
      )}

      {/* ── GALLERY ─────────────────────────────────────────────────── */}
      {activeSection === "gallery" && (
        <section className="page-section alt view-page" id="gallery">
          <h2 className="section-heading">Image &amp; Video Gallery</h2>

          <p className="section-sub">
            Photos and videos captured on-site while surveying water sources in
            Pauri Garhwal.
          </p>

          <div className="gallery-grid">
            {GALLERY_PHOTOS.map((photo) => (
              <div className="gallery-card" key={photo.src}>
                <button
                  className="gallery-image-button"
                  onClick={() => setGalleryZoom(photo)}
                  aria-label={`View ${photo.title}`}
                  type="button"
                >
                  <img src={photo.src} alt={photo.title} className="gallery-photo" loading="lazy" />
                  <span className="gallery-zoom-hint">🔍 Click to view</span>
                </button>

                <div className="gallery-caption">
                  <strong>{photo.title}</strong>
                  <span>{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="gallery-grid gallery-video-grid">
            <div className="gallery-card">
              <div className="gallery-video-wrapper">
                <video className="gallery-video" controls preload="metadata" playsInline>
                  <source src="/watervideo1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="gallery-caption">
                <strong>Kanda Water Source</strong>
                <span>On-site footage of a natural water source in Pauri Garhwal.</span>
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-video-wrapper">
                <video className="gallery-video" controls preload="metadata" playsInline>
                  <source src="/watervideo2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="gallery-caption">
                <strong>Praniya Walla Water Source</strong>
                <span>On-site footage of a natural water source in Pauri Garhwal.</span>
              </div>
            </div>
          </div>

          {galleryZoom && (
            <div className="gallery-lightbox" onClick={() => setGalleryZoom(null)}>
              <button className="gallery-close" onClick={() => setGalleryZoom(null)} type="button">✕</button>
              <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img className="gallery-lightbox-image" src={galleryZoom.src} alt={galleryZoom.title} />
                <div className="gallery-lightbox-caption">
                  <strong>{galleryZoom.title}</strong>
                  <span>{galleryZoom.caption}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── CONTRIBUTIONS ─────────────────────────────────────── */}
      {activeSection === "contributions" && (
        <section className="page-section view-page contributions-page" id="contributions">

          <h2 className="section-heading">
            Research Team
          </h2>

          <p className="section-sub">
            The project team working towards smart and sustainable water
            resource management in Uttarakhand.
          </p>

          {/* INSTITUTE LEADERSHIP */}
          <h3 className="contribution-heading">
            Institute Leadership
          </h3>

          <div className="leadership-grid">

            <div className="leadership-card">
              <div className="leadership-image">
                <img
                  src="/director-vk-banga.jpg"
                  alt="Prof. Dr. V. K. Banga"
                />
              </div>

              <div className="leadership-details">
                <h4>Prof. (Dr.) V. K. Banga</h4>
                <p>Director</p>
                <p>
                  Govind Ballabh Pant Institute of Engineering and
                  Technology, Pauri Uttarakhand
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leadership-image">
                <img
                  src="/dean-mamta-baunthiyal.jpg"
                  alt="Dr. Mamta Baunthiyal"
                />
              </div>

              <div className="leadership-details">
                <h4>Dr. Mamta Baunthiyal</h4>
                <p>Dean Research & Development</p>
                <p>
                  Govind Ballabh Pant Institute of Engineering and
                  Technology, Pauri Uttarakhand
                </p>
              </div>
            </div>

          </div>

          {/* PROJECT TEAM */}
          <h3 className="contribution-heading">
            Principal Investigators & Project Leadership
          </h3>

          <div className="contribution-team-list">

            <div className="contribution-member">
              <span className="member-role">
                Principal Investigator
              </span>

              <strong>Dr. Pushkar Praveen</strong>

              <span>Assistant Professor</span>
              <span>
                Department of Electronics & Communication Engineering
              </span>
              <span>
                G.B. Pant Institute of Engineering & Technology, Uttarakhand
              </span>
            </div>

            <div className="contribution-member">
              <span className="member-role">
                Co-Principal Investigator
              </span>

              <strong>Dr. Agya Ram Verma</strong>

              <span>Assistant Professor</span>
              <span>
                Department of Electronics & Communication Engineering
              </span>
              <span>
                G.B. Pant Institute of Engineering & Technology, Uttarakhand
              </span>
            </div>

            <div className="contribution-member">
              <span className="member-role">
                Co-Principal Investigator
              </span>

              <strong>Dr. Papendra Kumar</strong>

              <span>Assistant Professor</span>
              <span>
                Department of Computer Science & Engineering
              </span>
              <span>
                G.B. Pant Institute of Engineering & Technology, Uttarakhand
              </span>
            </div>

                    </div>

          {/* IMPLEMENTATION TEAM */}
          <h3 className="contribution-heading">
            Project Implementation Team
          </h3>

          <div className="contribution-team-list">

            <div className="contribution-member">
              <span className="member-role">
                Hardware &amp; IoT
              </span>
              <strong>Abhishek Pokhriyal</strong>
              <span>G.B. Pant Institute of Engineering &amp; Technology, Uttarakhand</span>
            </div>

            <div className="contribution-member">
              <span className="member-role">
                Software Development
              </span>
              <strong>Alisha Ziya Kavish</strong>
              <span>G.B. Pant Institute of Engineering &amp; Technology, Uttarakhand</span>
            </div>

            <div className="contribution-member">
              <span className="member-role">
                Research &amp; Analysis
              </span>
              <strong>Meet Chauhan</strong>
              <span>G.B. Pant Institute of Engineering &amp; Technology, Uttarakhand</span>
            </div>

          </div>

        </section>
      )}

  
      {/* ── CONTACT & SUPPORT ─────────────────────────────────────── */}
      {activeSection === "contact" && (
        <section className="page-section alt view-page" id="contact">
          <h2 className="section-heading">Contact &amp; Support</h2>

          <p className="section-sub">
            Questions, feedback, or want to contribute data? Get in touch with us
            using the contact details below.
          </p>

          <div className="info-card-row" style={{ marginBottom: 28 }}>
            <div className="info-card">
              <strong>Report an issue</strong>
              <p>
                Found incorrect data, a bug, or a problem with the website?
                Email us at{" "}
                <a href="mailto:Jalsrotuk@gmail.com">
                 Jalsrotuk@gmail.com
                </a>{" "}
                with a short description of the issue. A screenshot can also help
                us understand the problem.
              </p>
            </div>
          </div>

          <h3 className="section-heading" style={{ fontSize: "1.05rem" }}>
            How to contribute
          </h3>

          <div className="info-card-row">
            <div className="info-card">
              <strong>Share field photos</strong>
              <p>
                Have photograph of a water-source? Email them to{" "}
                <a href="mailto:Jalsrotuk@gmail.com">
                  Jalsrotuk@gmail.com
                </a>{" "}
                along with the source name, location or any useful field details.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── SOURCE DETAIL MODAL ─────────────────────────────────────── */}
      {selectedSource && (
        <div className="modal-backdrop" onClick={() => setSelectedSource(null)}>
          <section className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-dot" style={{ background: SOURCE_TYPE_COLORS[selectedSource.sourceType] || "#6b7280" }} />
                <h2>{selectedSource.name || "Unnamed source"}</h2>
              </div>
              <div className="modal-header-actions">
                <button className="modal-edit-btn" onClick={() => openEditSource(selectedSource)} type="button">Edit</button>
                <button className="modal-close-btn" onClick={() => setSelectedSource(null)} type="button">✕</button>
              </div>
            </div>
            <div className="detail-grid">
              {detailFields(selectedSource).map(([label, value]) => (
                <div className="detail-row" key={label}>
                  <span>{label}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── SOURCE EDITOR MODAL ─────────────────────────────────────── */}
      {sourceEditor && (
        <div className="modal-backdrop" onClick={() => setSourceEditor(null)}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={submitSource}>
            <div className="modal-header">
              <h2>{sourceEditor === "add" ? "Add Water Source" : "Edit Source"}</h2>
              <button className="modal-close-btn" onClick={() => setSourceEditor(null)} type="button">✕</button>
            </div>
            <p className="modal-desc">
              {sourceEditor === "add" ? "Add a new water source to JalSrot." : "Update verified source details."}
            </p>
            <label className="form-label">
              Source Name
              <input className="form-input" onChange={(e) => updateSourceField("name", e.target.value)} required value={sourceForm.name} />
            </label>
            <label className="form-label">
              Source Type
              <select className="form-input" onChange={(e) => updateSourceField("sourceType", e.target.value)} value={sourceForm.sourceType}>
                {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <div className="form-grid-2">
              <label className="form-label">
                Latitude <span className="form-hint">(N/S position, −90 to 90)</span>
                <input className="form-input" max="90" min="-90" onChange={(e) => updateSourceField("latitude", e.target.value)} placeholder="e.g. 30.1234" required step="any" type="number" value={sourceForm.latitude} />
              </label>
              <label className="form-label">
                Longitude <span className="form-hint">(E/W position, −180 to 180)</span>
                <input className="form-input" max="180" min="-180" onChange={(e) => updateSourceField("longitude", e.target.value)} placeholder="e.g. 78.5678" required step="any" type="number" value={sourceForm.longitude} />
              </label>
            </div>
            <label className="form-label">
              pH (optional)
              <input className="form-input" onChange={(e) => updateSourceField("ph", e.target.value)} step="any" type="number" value={sourceForm.ph} />
            </label>
            {sourceError && <p className="form-error">{sourceError}</p>}
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setSourceEditor(null)} type="button">Cancel</button>
              <button className="btn-primary" disabled={sourceBusy} type="submit">
                {sourceBusy ? "Saving…" : "Save source"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── AUTH MODAL ──────────────────────────────────────────────── */}
      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={submitAuth}>
            <div className="modal-header">
              <h2>{authMode === "register" ? "Create Account" : "Welcome back"}</h2>
              <button className="modal-close-btn" onClick={() => setAuthOpen(false)} type="button">✕</button>
            </div>
            <p className="modal-desc">
              {authMode === "register"
                ? "Create an account to add and manage water sources."
                : "Sign in to add and manage water sources."}
            </p>
            <label className="form-label">
              Email
              <input autoComplete="email" className="form-input" inputMode="email" onChange={(e) => updateAuthField("email", e.target.value)} required type="email" value={authForm.email} />
            </label>
            <label className="form-label">
              Password
              <input autoComplete={authMode === "register" ? "new-password" : "current-password"} className="form-input" minLength={6} onChange={(e) => updateAuthField("password", e.target.value)} required type="password" value={authForm.password} />
            </label>
            {authError && <p className="form-error">{authError}</p>}
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setAuthOpen(false)} type="button">Cancel</button>
              <button className="btn-primary" disabled={authBusy} type="submit">
                {authBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"}
              </button>
            </div>
            <button
              className="text-toggle-btn"
              disabled={authBusy}
              onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
              type="button"
            >
              {authMode === "register"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </form>
        </div>
      )}

      {/* ── REGION MODAL ────────────────────────────────────────────── */}
      {regionOpen && (
        <div className="modal-backdrop" onClick={() => setRegionOpen(false)}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={saveRegion}>
            <div className="modal-header">
              <h2>Where are you working?</h2>
              <button className="modal-close-btn" onClick={() => setRegionOpen(false)} type="button">✕</button>
            </div>
            <p className="modal-desc">This personalises your map. You can change it anytime from the Region button.</p>
            <label className="form-label">
              State or union territory
              <select className="form-input" onChange={(e) => { setRegionState(e.target.value); setRegionDistrict(""); }} required value={regionState}>
                <option value="">Tap to choose</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="form-label">
              District
              <input
                className="form-input"
                list="district-suggestions"
                onChange={(e) => setRegionDistrict(e.target.value)}
                placeholder={stateDistricts.length ? "Type or pick a suggestion" : "District name"}
                required
                value={regionDistrict}
              />
            </label>
            <datalist id="district-suggestions">
              {stateDistricts.map((d) => <option key={d} value={d} />)}
            </datalist>
            {stateDistricts.length > 0 && (
              <div className="chip-row">
                {stateDistricts.slice(0, 12).map((d) => (
                  <button className="chip" key={d} onClick={() => setRegionDistrict(d)} type="button">{d}</button>
                ))}
              </div>
            )}
            {authError && <p className="form-error">{authError}</p>}
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setRegionOpen(false)} type="button">Skip</button>
              <button className="btn-primary" disabled={regionBusy} type="submit">
                {regionBusy ? "Saving…" : "Save region"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}