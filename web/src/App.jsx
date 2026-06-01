import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://flutter-app-backend-1.onrender.com/api";

const STORAGE_TOKEN = "shrot_auth_token";
const STORAGE_USER = "shrot_auth_user";

const SOURCE_TYPES = ["well", "borewell", "river", "pond", "spring", "tap"];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const DISTRICTS = {
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "West Delhi",
  ],
  Gujarat: ["Ahmedabad", "Gandhinagar", "Rajkot", "Surat", "Vadodara"],
  Karnataka: ["Bengaluru Urban", "Dharwad", "Mysuru", "Udupi"],
  Maharashtra: ["Mumbai City", "Nagpur", "Nashik", "Pune", "Thane"],
  Rajasthan: ["Ajmer", "Jaipur", "Jodhpur", "Kota", "Udaipur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Karimnagar", "Nizamabad", "Warangal"],
  "Uttar Pradesh": ["Agra", "Gorakhpur", "Lucknow", "Prayagraj", "Varanasi"],
  Uttarakhand: [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi",
  ],
  "West Bengal": ["Darjeeling", "Howrah", "Kolkata", "Malda", "Nadia"],
};

const EMPTY_SOURCE_FORM = {
  name: "",
  sourceType: "well",
  latitude: "",
  longitude: "",
  ph: "",
};

const TILE_SIZE = 256;
const INDIA_CENTER = { latitude: 22.5937, longitude: 78.9629 };
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function clampLatitude(latitude) {
  return Math.max(-85, Math.min(85, latitude));
}

function wrapLongitude(longitude) {
  if (!Number.isFinite(longitude)) return INDIA_CENTER.longitude;
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function latLngToWorld(latitude, longitude, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = clampLatitude(latitude);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((wrapLongitude(longitude) + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) *
      scale,
  };
}

function worldToLatLng(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return {
    latitude: clampLatitude(latitude),
    longitude: wrapLongitude(longitude),
  };
}

function readSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cleanError(error, fallback = "Something went wrong") {
  if (!error) return fallback;
  return String(error).replace(/^Error:\s*/, "") || fallback;
}

function sourceCoords(source) {
  const coords = source?.location?.coordinates;
  return {
    longitude:
      Array.isArray(coords) && coords.length > 0
        ? Number(coords[0])
        : Number(source?.longitude || 0),
    latitude:
      Array.isArray(coords) && coords.length > 1
        ? Number(coords[1])
        : Number(source?.latitude || 0),
  };
}

function districtFromAddress(address = {}) {
  return (
    address.state_district ||
    address.county ||
    address.city_district ||
    address.district ||
    address.city ||
    address.town ||
    address.village ||
    ""
  );
}

function formatSearchResult(item) {
  const address = item.address || {};
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  return {
    id: item.place_id,
    name: item.name || item.display_name?.split(",")[0] || "Selected location",
    displayName: item.display_name || "Selected location",
    district: districtFromAddress(address),
    state: address.state || "",
    latitude,
    longitude,
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
    [
      "Created At",
      source.createdAt ? new Date(source.createdAt).toLocaleString() : "N/A",
    ],
  ];
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }

  return body;
}

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

  const [regionState, setRegionState] = useState(user?.state || "");
  const [regionDistrict, setRegionDistrict] = useState(user?.district || "");
  const [regionBusy, setRegionBusy] = useState(false);

  const [sources, setSources] = useState([]);
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
  const [districtFilter, setDistrictFilter] = useState(user?.district || "");
  const [mapSize, setMapSize] = useState({ width: 900, height: 640 });
  const [mapTouched, setMapTouched] = useState(false);
  const [mapView, setMapView] = useState({
    ...INDIA_CENTER,
    zoom: 5,
  });

  const isLoggedIn = Boolean(token && user);
  const needsRegion = isLoggedIn && (!user.regionCompleted || !user.state || !user.district);
  const canManageSources = Boolean(user?.canManageSources);
  const stateDistricts = DISTRICTS[regionState] || [];

  const filteredSources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sources;
    return sources.filter((source) =>
      [source.name, source.sourceType, source.village, source.district, source.state]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [query, sources]);

  const tileLayout = useMemo(() => {
    const zoom = mapView.zoom;
    const scale = TILE_SIZE * 2 ** zoom;
    const center = latLngToWorld(mapView.latitude, mapView.longitude, zoom);
    const left = center.x - mapSize.width / 2;
    const top = center.y - mapSize.height / 2;
    const minX = Math.floor(left / TILE_SIZE);
    const maxX = Math.floor((left + mapSize.width) / TILE_SIZE);
    const minY = Math.floor(top / TILE_SIZE);
    const maxY = Math.floor((top + mapSize.height) / TILE_SIZE);
    const worldTiles = 2 ** zoom;
    const tiles = [];

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
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

    return { center, left, top, scale, tiles, zoom };
  }, [mapSize.height, mapSize.width, mapView.latitude, mapView.longitude, mapView.zoom]);

  const projectedSources = useMemo(
    () =>
      filteredSources.map((source) => {
        const { latitude, longitude } = sourceCoords(source);
        const point = latLngToWorld(latitude, longitude, tileLayout.zoom);
        return {
          source,
          left: point.x - tileLayout.left,
          top: point.y - tileLayout.top,
        };
      }),
    [filteredSources, tileLayout.left, tileLayout.top, tileLayout.zoom],
  );

  const projectedSelectedPoint = useMemo(() => {
    if (!selectedPoint) return null;
    const point = latLngToWorld(selectedPoint.latitude, selectedPoint.longitude, tileLayout.zoom);
    return {
      left: point.x - tileLayout.left,
      top: point.y - tileLayout.top,
    };
  }, [selectedPoint, tileLayout.left, tileLayout.top, tileLayout.zoom]);

  const projectedSearchedPoint = useMemo(() => {
    if (!searchedPoint) return null;
    const point = latLngToWorld(searchedPoint.latitude, searchedPoint.longitude, tileLayout.zoom);
    return {
      left: point.x - tileLayout.left,
      top: point.y - tileLayout.top,
    };
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
      setSources(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setSourcesError(cleanError(error, "Failed to load sources"));
    } finally {
      setSourcesBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    let cancelled = false;
    request("/auth/me", { token })
      .then((body) => {
        if (cancelled) return;
        persistSession(token, body.user);
        setRegionState(body.user?.state || "");
        setRegionDistrict(body.user?.district || "");
        setDistrictFilter(body.user?.district || "");
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout, persistSession, token]);

  useEffect(() => {
    if (isLoggedIn && !needsRegion) {
      loadSources(user?.district || "");
    }
  }, [isLoggedIn, loadSources, needsRegion, user?.district]);

  useEffect(() => {
    if (!mapRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setMapSize({
        width: Math.max(320, rect.width),
        height: Math.max(360, rect.height),
      });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mapTouched || filteredSources.length === 0) return;
    const { latitude, longitude } = sourceCoords(filteredSources[0]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setMapView({
      latitude,
      longitude,
      zoom: districtFilter ? 10 : 5,
    });
  }, [districtFilter, filteredSources, mapTouched]);

  function updateAuthField(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");

    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const body = await request(path, {
        method: "POST",
        body: JSON.stringify(authForm),
      });
      persistSession(body.token, body.user);
      setRegionState(body.user?.state || "");
      setRegionDistrict(body.user?.district || "");
      setDistrictFilter(body.user?.district || "");
    } catch (error) {
      setAuthError(cleanError(error, "Authentication failed"));
    } finally {
      setAuthBusy(false);
    }
  }

  async function saveRegion(event) {
    event.preventDefault();
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
    } catch (error) {
      setAuthError(cleanError(error, "Could not save region"));
    } finally {
      setRegionBusy(false);
    }
  }

  async function searchLocation(event) {
    event.preventDefault();
    const text = locationQuery.trim();
    if (!text || locationSearching) return;

    setLocationSearching(true);
    setLocationError("");
    setLocationResults([]);
    try {
      const params = new URLSearchParams({
        q: text,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        countrycodes: "in",
      });
      const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`);
      if (!response.ok) throw new Error("Could not search locations");
      const data = await response.json();
      const results = Array.isArray(data)
        ? data.map(formatSearchResult).filter((result) =>
            Number.isFinite(result.latitude) && Number.isFinite(result.longitude),
          )
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
    setSearchedPoint({
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
    });
    setMapTouched(true);
    setMapView({
      latitude: result.latitude,
      longitude: result.longitude,
      zoom: 14,
    });

    if (result.district) {
      setDistrictFilter(result.district);
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
      const params = new URLSearchParams({
        q: text,
        format: "jsonv2",
        addressdetails: "1",
        limit: "1",
        countrycodes: "in",
      });
      const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`);
      if (!response.ok) throw new Error("Could not find region");
      const [first] = await response.json();
      if (!first) throw new Error("Could not find region");
      const result = formatSearchResult(first);
      setMapTouched(true);
      setMapView({
        latitude: result.latitude,
        longitude: result.longitude,
        zoom: district ? 11 : 7,
      });
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

  function updateSourceField(field, value) {
    setSourceForm((current) => ({ ...current, [field]: value }));
  }

  async function submitSource(event) {
    event.preventDefault();
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
        isEditing
          ? `/water-sources/${sourceEditor._id || sourceEditor.id}`
          : "/water-sources/add",
        {
          method: isEditing ? "PATCH" : "POST",
          token,
          body: JSON.stringify(payload),
        },
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

  function pickMapPoint(event) {
    if (!canManageSources) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const worldX = tileLayout.left + x;
    const worldY = tileLayout.top + y;
    setSelectedPoint(worldToLatLng(worldX, worldY, mapView.zoom));
  }

  function beginMapDrag(event) {
    if (event.button !== 0) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      center: latLngToWorld(mapView.latitude, mapView.longitude, mapView.zoom),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveMapDrag(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.moved = true;
      setMapTouched(true);
    }
    const next = worldToLatLng(
      drag.center.x - dx,
      drag.center.y - dy,
      mapView.zoom,
    );
    setMapView((current) => ({ ...current, ...next }));
  }

  function endMapDrag() {
    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  }

  function zoomMap(delta, anchor) {
    setMapTouched(true);
    setMapView((current) => {
      const nextZoom = Math.max(3, Math.min(18, current.zoom + delta));
      if (nextZoom === current.zoom) return current;
      if (!anchor) return { ...current, zoom: nextZoom };

      const beforeTopLeft = {
        x: latLngToWorld(current.latitude, current.longitude, current.zoom).x - mapSize.width / 2,
        y: latLngToWorld(current.latitude, current.longitude, current.zoom).y - mapSize.height / 2,
      };
      const anchorWorld = {
        x: beforeTopLeft.x + anchor.x,
        y: beforeTopLeft.y + anchor.y,
      };
      const anchorLatLng = worldToLatLng(anchorWorld.x, anchorWorld.y, current.zoom);
      const anchorWorldNext = latLngToWorld(
        anchorLatLng.latitude,
        anchorLatLng.longitude,
        nextZoom,
      );
      const nextCenter = {
        x: anchorWorldNext.x - anchor.x + mapSize.width / 2,
        y: anchorWorldNext.y - anchor.y + mapSize.height / 2,
      };
      return { ...worldToLatLng(nextCenter.x, nextCenter.y, nextZoom), zoom: nextZoom };
    });
  }

  function handleMapWheel(event) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoomMap(event.deltaY < 0 ? 1 : -1, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  if (booting) {
    return (
      <main className="splash">
        <div className="brand-mark"><span className="drop-icon" /></div>
        <h1>Shrot</h1>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="auth-screen">
        <section className="auth-hero">
          <div className="brand-mark"><span className="drop-icon" /></div>
          <h1>Shrot</h1>
          <p>
            {authMode === "register"
              ? "Create an account to map and track water sources."
              : "Sign in to continue."}
          </p>
        </section>

        <form className="panel auth-panel" onSubmit={submitAuth}>
          <h2>{authMode === "register" ? "Sign up" : "Welcome back"}</h2>
          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => updateAuthField("email", event.target.value)}
              required
              type="email"
              value={authForm.email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={authMode === "register" ? "new-password" : "current-password"}
              minLength={6}
              onChange={(event) => updateAuthField("password", event.target.value)}
              required
              type="password"
              value={authForm.password}
            />
          </label>
          {authError && <p className="error-text">{authError}</p>}
          <button className="primary-button" disabled={authBusy} type="submit">
            {authBusy
              ? "Please wait..."
              : authMode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
          <button
            className="text-button"
            disabled={authBusy}
            onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
            type="button"
          >
            {authMode === "register"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </form>
      </main>
    );
  }

  if (needsRegion) {
    return (
      <main className="region-screen">
        <header className="app-bar">
          <strong>Shrot</strong>
          <button className="text-button compact" onClick={logout} type="button">
            Sign out
          </button>
        </header>
        <form className="region-content" onSubmit={saveRegion}>
          <div>
            <h1>Where are you working?</h1>
            <p>
              We use this to personalise your map context. You can change it
              from the app menu whenever needed.
            </p>
          </div>
          <section className="panel">
            <div className="section-title">
              <span className="soft-icon"><span className="circle-icon" /></span>
              <h2>State or union territory</h2>
            </div>
            <select
              onChange={(event) => {
                setRegionState(event.target.value);
                setRegionDistrict("");
              }}
              required
              value={regionState}
            >
              <option value="">Tap to choose</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <div className="section-title">
              <span className="soft-icon alt"><span className="pin-icon" /></span>
              <h2>District</h2>
            </div>
            <input
              list="district-suggestions"
              onChange={(event) => setRegionDistrict(event.target.value)}
              placeholder={
                stateDistricts.length ? "Type or pick a suggestion" : "District name"
              }
              required
              value={regionDistrict}
            />
            <datalist id="district-suggestions">
              {stateDistricts.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
            {stateDistricts.length > 0 && (
              <div className="chip-row">
                {stateDistricts.slice(0, 12).map((district) => (
                  <button
                    className="chip"
                    key={district}
                    onClick={() => setRegionDistrict(district)}
                    type="button"
                  >
                    {district}
                  </button>
                ))}
              </div>
            )}
          </section>
          {authError && <p className="error-text">{authError}</p>}
          <button className="primary-button" disabled={regionBusy} type="submit">
            {regionBusy ? "Saving..." : "Continue to map"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-bar">
        <div className="bar-brand">
          <span className="mini-mark"><span className="drop-icon small" /></span>
          <strong>Shrot</strong>
        </div>
        <div className="bar-actions">
          <button
            className="ghost-button"
            onClick={() => {
              setRegionState(user.state || "");
              setRegionDistrict(user.district || "");
              setUser({ ...user, regionCompleted: false });
            }}
            type="button"
          >
            Region
          </button>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="side-panel">
          <div className="profile-block">
            <span className="avatar">{user.email?.[0]?.toUpperCase() || "S"}</span>
            <div>
              <strong>{user.email}</strong>
              <small>{canManageSources ? "Source manager" : "Public viewer"}</small>
            </div>
          </div>

          <label>
            Search sources
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, type, district"
              value={query}
            />
          </label>

          <label>
            Active district
            <input
              onChange={(event) => setDistrictFilter(event.target.value)}
              placeholder="All sources"
              value={districtFilter}
            />
          </label>

          <div className="metric-grid">
            <div>
              <strong>{filteredSources.length}</strong>
              <span>Visible</span>
            </div>
            <div>
              <strong>{sources.length}</strong>
              <span>Total</span>
            </div>
          </div>

          {canManageSources ? (
            <button className="primary-button" onClick={() => openAddSource()} type="button">
              Add source
            </button>
          ) : (
            <p className="notice">Only approved users can add or edit water sources.</p>
          )}

          <button
            className="ghost-button full"
            disabled={sourcesBusy}
            onClick={() => loadSources(districtFilter)}
            type="button"
          >
            {sourcesBusy ? "Refreshing..." : "Refresh"}
          </button>
        </aside>

        <section className="map-stage">
          <div className="map-toolbar">
            <div>
              <strong>
                {districtFilter ? `Sources in ${districtFilter}` : "All sources"}
              </strong>
              <span>
                {user.state}, {user.district}
              </span>
            </div>
            <form className="map-search" onSubmit={searchLocation}>
              <input
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Search a location"
                value={locationQuery}
              />
              <button className="primary-button small" disabled={locationSearching} type="submit">
                {locationSearching ? "Searching" : "Search"}
              </button>
            </form>
            <div className="map-toolbar-actions">
              <button className="ghost-button compact" onClick={moveToUserRegion} type="button">
                My region
              </button>
              {selectedPoint && canManageSources && (
                <button className="primary-button small" onClick={() => openAddSource()} type="button">
                Use picked point
                </button>
              )}
            </div>
          </div>
          {(locationResults.length > 0 || locationError) && (
            <div className="search-results">
              {locationError && <p>{locationError}</p>}
              {locationResults.map((result) => (
                <button key={result.id} onClick={() => selectLocation(result)} type="button">
                  <strong>{result.name}</strong>
                  <span>{result.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {sourcesError && <p className="error-banner">{sourcesError}</p>}

          <div
            className="map-canvas"
            onClick={(event) => {
              if (dragRef.current?.moved) return;
              pickMapPoint(event);
            }}
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
            {sourcesBusy && <div className="loading-pill">Loading sources...</div>}
            <div className="map-controls">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  zoomMap(1);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                +
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  zoomMap(-1);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                -
              </button>
            </div>
            {projectedSearchedPoint && (
              <button
                className="map-pin search-pin"
                onClick={(event) => event.stopPropagation()}
                style={projectedSearchedPoint}
                title={searchedPoint?.name || "Searched location"}
                type="button"
              >
                <span className="search-dot" />
              </button>
            )}
            {projectedSources.map(({ source, left, top }) => (
              <button
                className="map-pin"
                key={source._id || source.id || source.name}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedSource(source);
                }}
                style={{ left, top }}
                title={source.name}
                type="button"
              >
                <span className="drop-icon pin-drop" />
              </button>
            ))}
            {selectedPoint && canManageSources && (
              <button
                className="map-pin add-pin"
                onClick={(event) => {
                  event.stopPropagation();
                  openAddSource(selectedPoint);
                }}
                style={projectedSelectedPoint}
                type="button"
              >
                <span>+</span>
              </button>
            )}
            <a
              className="map-attribution"
              href="https://www.openstreetmap.org/copyright"
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMap
            </a>
          </div>
        </section>

        <aside className="source-list">
          <h2>Sources</h2>
          <div className="list-scroll">
            {filteredSources.length === 0 && (
              <p className="empty-state">
                {sourcesBusy ? "Loading..." : "No water sources found."}
              </p>
            )}
            {filteredSources.map((source) => {
              const { latitude, longitude } = sourceCoords(source);
              return (
                <button
                  className="source-row"
                  key={source._id || source.id || source.name}
                  onClick={() => focusSource(source)}
                  type="button"
                >
                  <span className="soft-icon"><span className="drop-icon small" /></span>
                  <span>
                    <strong>{source.name || "Unnamed source"}</strong>
                    <small>
                      {source.sourceType || "source"} - {source.district || "N/A"}
                    </small>
                    <small>
                      {Number.isFinite(latitude) ? latitude.toFixed(3) : "N/A"},
                      {" "}
                      {Number.isFinite(longitude) ? longitude.toFixed(3) : "N/A"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      {selectedSource && (
        <div className="modal-backdrop" onClick={() => setSelectedSource(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              <span className="soft-icon"><span className="drop-icon small" /></span>
              <h2>{selectedSource.name || "Unnamed source"}</h2>
              {canManageSources && (
                <button
                  className="ghost-button"
                  onClick={() => openEditSource(selectedSource)}
                  type="button"
                >
                  Edit
                </button>
              )}
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

      {sourceEditor && (
        <div className="modal-backdrop" onClick={() => setSourceEditor(null)}>
          <form className="editor-sheet" onClick={(event) => event.stopPropagation()} onSubmit={submitSource}>
            <h2>{sourceEditor === "add" ? "Add Source" : "Edit Source"}</h2>
            <p>
              {sourceEditor === "add"
                ? "Add a new water source to Shrot"
                : "Update verified source details."}
            </p>

            <label>
              Source Name
              <input
                onChange={(event) => updateSourceField("name", event.target.value)}
                required
                value={sourceForm.name}
              />
            </label>
            <label>
              Source Type
              <select
                onChange={(event) => updateSourceField("sourceType", event.target.value)}
                value={sourceForm.sourceType}
              >
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-grid">
              <label>
                Latitude
                <input
                  max="90"
                  min="-90"
                  onChange={(event) => updateSourceField("latitude", event.target.value)}
                  required
                  step="any"
                  type="number"
                  value={sourceForm.latitude}
                />
              </label>
              <label>
                Longitude
                <input
                  max="180"
                  min="-180"
                  onChange={(event) => updateSourceField("longitude", event.target.value)}
                  required
                  step="any"
                  type="number"
                  value={sourceForm.longitude}
                />
              </label>
            </div>
            <label>
              pH (optional)
              <input
                onChange={(event) => updateSourceField("ph", event.target.value)}
                step="any"
                type="number"
                value={sourceForm.ph}
              />
            </label>

            {sourceError && <p className="error-text">{sourceError}</p>}
            <div className="editor-actions">
              <button className="ghost-button" onClick={() => setSourceEditor(null)} type="button">
                Cancel
              </button>
              <button className="primary-button" disabled={sourceBusy} type="submit">
                {sourceBusy ? "Saving..." : "Save source"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
