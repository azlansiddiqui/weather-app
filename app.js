/**
 * Weather App - JavaScript
 * Fetches real-time weather data from OpenWeather API
 * Features: search, current weather, 5-day forecast, dark mode, localStorage
 */

// =========================
// CONFIGURATION
// =========================

const apiKey = "6615ac79cb6423ef007e1d3bb49f21b4";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// =========================
// DOM ELEMENTS CACHE
// =========================

const dom = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    darkModeToggle: document.getElementById('darkModeToggle'),

    weatherDisplay: document.getElementById('weatherDisplay'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    forecastSection: document.getElementById('forecastSection'),

    cityName: document.getElementById('cityName'),
    temperature: document.getElementById('temperature'),
    condition: document.getElementById('condition'),
    description: document.getElementById('description'),
    weatherIcon: document.getElementById('weatherIcon'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),

    forecastList: document.getElementById('forecastList'),
};

// =========================
// UI STATE HELPERS
// =========================

function showLoading() {
    dom.loadingSpinner.classList.remove('hidden');
    dom.weatherDisplay.classList.add('hidden');
    dom.forecastSection.classList.add('hidden');
    dom.errorMessage.classList.add('hidden');
}

function hideLoading() {
    dom.loadingSpinner.classList.add('hidden');
}

function showError() {
    dom.errorMessage.classList.remove('hidden');
    dom.weatherDisplay.classList.add('hidden');
    dom.forecastSection.classList.add('hidden');
}

function hideError() {
    dom.errorMessage.classList.add('hidden');
}

function showWeatherDisplay() {
    dom.weatherDisplay.classList.remove('hidden');
    dom.forecastSection.classList.remove('hidden');
}

// =========================
// UTILITY FUNCTIONS
// =========================

// Capitalize first letter for better UI formatting
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Convert timestamp/date into weekday name
function getDayName(dateInput) {
    const date = typeof dateInput === 'number'
        ? new Date(dateInput * 1000)
        : new Date(dateInput);

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[date.getDay()];
}

// OpenWeather icon helper
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// =========================
// BACKGROUND HANDLING
// =========================

function updateBackground(weatherMain) {
    document.body.classList.remove(
        'sunny','cloudy','rainy','snowy','thunderstorm','drizzle','mist'
    );

    const map = {
        Clear: 'sunny',
        Clouds: 'cloudy',
        Rain: 'rainy',
        Drizzle: 'drizzle',
        Thunderstorm: 'thunderstorm',
        Snow: 'snowy',
        Mist: 'mist',
        Fog: 'mist',
        Haze: 'mist',
    };

    const cls = map[weatherMain];
    if (cls) document.body.classList.add(cls);
}

// =========================
// CURRENT WEATHER UI
// =========================

function updateCurrentWeather(data) {
    const city = data.name;
    const country = data.sys.country;

    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);

    const weather = data.weather[0];

    dom.cityName.textContent = `${city}, ${country}`;
    dom.temperature.textContent = temp;
    dom.condition.textContent = weather.main;
    dom.description.textContent = capitalizeFirst(weather.description);
    dom.weatherIcon.src = getWeatherIconUrl(weather.icon);
    dom.weatherIcon.alt = weather.description;

    dom.feelsLike.textContent = `${feelsLike}°`;
    dom.humidity.textContent = `${data.main.humidity}%`;
    dom.windSpeed.textContent = `${data.wind.speed} m/s`;
    dom.pressure.textContent = `${data.main.pressure} hPa`;
}

// =========================
// FORECAST UI
// =========================

function updateForecast(data) {
    dom.forecastList.innerHTML = '';

    const seen = new Set();
    const today = new Date().toISOString().split('T')[0];

    const daily = [];

    for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];

        if (seen.has(date) || date === today) continue;
        seen.add(date);

        daily.push(item);
        if (daily.length >= 5) break;
    }

    for (const f of daily) {
        const el = document.createElement('div');
        el.className = 'forecast-item';

        el.innerHTML = `
            <span class="forecast-day">${getDayName(f.dt_txt)}</span>
            <img class="forecast-icon" src="${getWeatherIconUrl(f.weather[0].icon)}" alt="">
            <span class="forecast-condition">${f.weather[0].main}</span>
            <span class="forecast-temp">${Math.round(f.main.temp)}°C</span>
        `;

        dom.forecastList.appendChild(el);
    }
}

// =========================
// API CALLS
// =========================

async function fetchWeatherByCity(city) {
    try {
        showLoading();

        const current = `${BASE_URL}/weather?q=${city}&units=metric&appid=${apiKey}`;
        const forecast = `${BASE_URL}/forecast?q=${city}&units=metric&appid=${apiKey}`;

        const [cRes, fRes] = await Promise.all([
            fetch(current),
            fetch(forecast)
        ]);

        if (!cRes.ok || !fRes.ok) throw new Error("City not found");

        const cData = await cRes.json();
        const fData = await fRes.json();

        updateCurrentWeather(cData);
        updateForecast(fData);
        updateBackground(cData.weather[0].main);

        hideLoading();
        hideError();
        showWeatherDisplay();

        localStorage.setItem('lastCity', city);

    } catch (err) {
        console.error(err);
        hideLoading();
        showError();
    }
}

// Fetch weather using GPS coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();

        const current = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        const forecast = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

        const [cRes, fRes] = await Promise.all([fetch(current), fetch(forecast)]);

        if (!cRes.ok || !fRes.ok) throw new Error("Location error");

        const cData = await cRes.json();
        const fData = await fRes.json();

        updateCurrentWeather(cData);
        updateForecast(fData);
        updateBackground(cData.weather[0].main);

        hideLoading();
        hideError();
        showWeatherDisplay();

        localStorage.setItem('lastCity', cData.name);

    } catch (err) {
        console.error(err);
        hideLoading();
        showError();
    }
}

// =========================
// DARK MODE
// =========================

function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    const icon = dom.darkModeToggle.querySelector('i');
    icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    const icon = dom.darkModeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// =========================
// EVENTS
// =========================

dom.searchBtn.addEventListener('click', () => {
    const city = dom.cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

dom.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = dom.cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

dom.darkModeToggle.addEventListener('click', toggleDarkMode);

// =========================
// INIT
// =========================

function init() {
    loadTheme();

    const savedCity = localStorage.getItem('lastCity');

    if (savedCity) {
        dom.cityInput.value = savedCity;
        fetchWeatherByCity(savedCity);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => fetchWeatherByCity('London')
        );
    } else {
        fetchWeatherByCity('London');
    }
}

document.addEventListener('DOMContentLoaded', init);
// PWA Service Worker Register
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => console.log("PWA Ready ✅"))
            .catch(err => console.log("SW Error:", err));
    });
}