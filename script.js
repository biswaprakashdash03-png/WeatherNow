
const $ = (id) => document.getElementById(id);

const indianCities = [
  "Agartala", "Agra", "Ahmedabad", "Aizawl", "Ajmer",
  "Akola", "Aligarh", "Amravati", "Amritsar", "Anantapur",
  "Asansol", "Aurangabad", "Ayodhya", "Bengaluru", "Berhampur",
  "Bhagalpur", "Bharatpur", "Bhilai", "Bhilwara", "Bhiwandi",
  "Bhopal", "Bhubaneswar", "Bhuj", "Bikaner", "Bilaspur",
  "Bokaro", "Chandigarh", "Chennai", "Coimbatore", "Cuttack",
  "Darbhanga", "Dehradun", "Delhi", "Dhanbad", "Dibrugarh",
  "Durgapur", "Erode", "Faridabad", "Gandhinagar", "Gangtok",
  "Gaya", "Ghaziabad", "Gorakhpur", "Greater Noida", "Guntur",
  "Gurugram", "Guwahati", "Gwalior", "Haridwar", "Hisar",
  "Howrah", "Hubballi", "Hyderabad", "Imphal", "Indore",
  "Itanagar", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon",
  "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur",
  "Jorhat", "Kadapa", "Kannur", "Kanpur", "Karnal",
  "Kochi", "Kolhapur", "Kolkata", "Kollam", "Kota",
  "Kozhikode", "Kurnool", "Latur", "Lucknow", "Ludhiana",
  "Madurai", "Malappuram", "Mangaluru", "Meerut", "Moradabad",
  "Mumbai", "Mysuru", "Nagpur", "Nanded", "Nashik",
  "Navi Mumbai", "Nellore", "Noida", "Ongole", "Palakkad",
  "Panaji", "Patiala", "Patna", "Pondicherry", "Prayagraj",
  "Puducherry", "Pune", "Puri", "Raipur", "Rajahmundry",
  "Rajkot", "Ranchi", "Rourkela", "Rohtak", "Saharanpur",
  "Salem", "Sambalpur", "Sangli", "Shillong", "Shimla",
  "Shivamogga", "Siliguri", "Solapur", "Srinagar", "Surat",
  "Thane", "Thanjavur", "Thiruvananthapuram", "Thrissur",
  "Tiruchirappalli", "Tirunelveli", "Tirupati", "Udaipur",
  "Ujjain", "Vadodara", "Varanasi", "Vasai-Virar",
  "Vellore", "Vijayawada", "Visakhapatnam", "Warangal"
];

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Moderate snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️"]
};

function getWeather(code) {
  return weatherCodes[code] || ["Unknown conditions", "🌡️"];
}

function setMessage(message, isError = false) {
  $("message").textContent = message;
  $("message").classList.toggle("error", isError);
}

function formatDate(dateString, options) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-IN",
    options
  );
}

// Populate autocomplete suggestions
const cityList = $("indiaCities");

indianCities.forEach((city) => {
  const option = document.createElement("option");
  option.value = city;
  cityList.appendChild(option);
});

// Search Indian cities using the geocoding database
async function searchCity(city) {
  const query = city.trim();

  if (!query) {
    setMessage("Please enter an Indian city name.", true);
    return;
  }

  setMessage(`Searching India for "${query}"...`);

  try {
    const params = new URLSearchParams({
      name: query,
      count: 100,
      language: "en",
      format: "json"
    });

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`
    );

    if (!response.ok) {
      throw new Error("Could not search locations. Try again.");
    }

    const data = await response.json();

    const results = (data.results || []).filter(
      (place) => place.country_code === "IN"
    );

    if (!results.length) {
      throw new Error(
        "Indian city not found. Check the spelling or try another city."
      );
    }

    const exactMatch = results.find(
      (place) => place.name.toLowerCase() === query.toLowerCase()
    );

    const place = exactMatch || results[0];

    const details = [
      place.admin1,
      place.country || "India"
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    await loadWeather(
      place.latitude,
      place.longitude,
      place.name,
      details
    );
  } catch (error) {
    setMessage(error.message || "Something went wrong.", true);
  }
}

// Fetch current weather and forecast
async function loadWeather(latitude, longitude, city, country = "") {
  setMessage(`Loading weather for ${city}...`);

  try {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "uv_index_max"
      ].join(","),
      hourly: "visibility",
      timezone: "auto",
      forecast_days: 6
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (!response.ok) {
      throw new Error("Unable to load weather data.");
    }

    const data = await response.json();

    renderCurrentWeather(data);
    renderForecast(data);

    $("cityName").textContent = country
      ? `${city}, ${country}`
      : city;

    setMessage(`Weather updated for ${city}.`);
  } catch (error) {
    setMessage(error.message || "Unable to load weather.", true);
    $("forecast").innerHTML =
      "<p class='muted'>Forecast unavailable. Please try again.</p>";
  }
}

// Display current conditions
function renderCurrentWeather(data) {
  const current = data.current;
  const daily = data.daily;
  const [description, icon] = getWeather(current.weather_code);

  $("currentDate").textContent = formatDate(
    current.time.slice(0, 10),
    {
      weekday: "long",
      month: "short",
      day: "numeric"
    }
  );

  $("weatherIcon").textContent =
    current.is_day === 0 && current.weather_code === 0
      ? "🌙"
      : icon;

  $("temperature").textContent = Math.round(current.temperature_2m);
  $("weatherDescription").textContent = description;

  $("highTemp").textContent =
    `${Math.round(daily.temperature_2m_max[0])}°`;

  $("lowTemp").textContent =
    `${Math.round(daily.temperature_2m_min[0])}°`;

  $("feelsLike").textContent =
    `${Math.round(current.apparent_temperature)}°`;

  $("humidity").textContent = `${current.relative_humidity_2m}%`;
  $("windSpeed").textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  $("uvIndex").textContent =
    daily.uv_index_max[0] != null
      ? Number(daily.uv_index_max[0]).toFixed(1)
      : "--";

  const currentTime = new Date(current.time).getTime();

  const visibilityIndex = data.hourly.time.findIndex(
    (time) => new Date(time).getTime() >= currentTime
  );

  const visibility =
    visibilityIndex >= 0
      ? data.hourly.visibility[visibilityIndex]
      : null;

  $("visibility").textContent =
    visibility != null
      ? `${(visibility / 1000).toFixed(1)} km`
      : "-- km";
}

// Display the next five days
function renderForecast(data) {
  const daily = data.daily;

  $("forecast").innerHTML = daily.time
    .slice(1, 6)
    .map((date, index) => {
      const i = index + 1;
      const [description, icon] = getWeather(daily.weather_code[i]);

      const day = formatDate(date, { weekday: "short" });

      return `
        <article class="forecast-day">
          <span class="day-name">${day}</span>
          <span class="day-icon">${icon}</span>
          <span class="day-description">${description}</span>
          <div class="day-temps">
            <span>${Math.round(daily.temperature_2m_max[i])}°</span>
            <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span>
          </div>
        </article>
      `;
    })
    .join("");
}

// Submit a city search
$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchCity($("cityInput").value);
});

// Light and dark mode
$("themeToggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");

  $("themeToggle").textContent = isDark ? "☀" : "☾";

  document.querySelector('meta[name="theme-color"]').content =
    isDark ? "#101725" : "#f4f7fb";
});

// Get weather for the device's current location
$("locationButton").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setMessage("Geolocation is not supported by your browser.", true);
    return;
  }

  setMessage("Requesting your location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const params = new URLSearchParams({
          latitude,
          longitude,
          language: "en",
          format: "json"
        });

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?${params}`
        );

        const data = response.ok ? await response.json() : {};
        const place = data.results?.[0];

        await loadWeather(
          latitude,
          longitude,
          place?.name || "Your location",
          [
            place?.admin1,
            place?.country
          ].filter(Boolean).join(", ")
        );
      } catch {
        await loadWeather(latitude, longitude, "Your location");
      }
    },
    () => {
      setMessage(
        "Location permission denied. Search for a city instead.",
        true
      );
    },
    {
      enableHighAccuracy: false,
      timeout: 10000
    }
  );
});

// Initial weather
searchCity("Bhubaneswar");
