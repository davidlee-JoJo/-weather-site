const API_KEY = 'e1471b38f55e46e683880847260207';
const LOCATIONS = [
  { name: '台北北投', lat: 25.1167, lon: 121.5167 },
  { name: '新北汐止', lat: 25.0667, lon: 121.6333 },
  { name: '嘉義太保', lat: 23.4667, lon: 120.3333 },
  { name: '台北中山', lat: 25.0667, lon: 121.5333 },
  { name: '台北南港', lat: 25.0500, lon: 121.6000 },
  { name: '新北三重', lat: 25.0667, lon: 121.4667 },
  { name: '桃園南崁', lat: 25.0500, lon: 121.3000 }
];

const CN2TW = {
  '小阵雨': '小陣雨', '局部多云': '局部多雲', '薄雾': '薄霧', '烟霾': '煙霾',
  '霾': '霾', '阴天': '陰天', '晴天': '晴天', '阵雨': '陣雨',
  '小雨': '小雨', '局部小毛毛雨': '局部小毛毛雨', '局部小雨': '局部小雨',
  '附近局部降雨': '鄰近局部降雨', '中雨': '中雨', '大雨': '大雨',
  '雷雨': '雷雨', '大雷雨': '大雷雨', '多云': '多雲', '局部降雨': '局部降雨',
  '附近有雷暴': '鄰近有雷暴', '局部毛毛雨': '局部毛毛雨', '毛毛雨': '毛毛雨'
};
function toTW(text) { return CN2TW[text] || text; }

const AQI_LABELS = ['', '良好', '中等', '對敏感族群不健康', '不健康', '非常不健康', '危害'];
const AQI_CLASSES = ['', 'good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];
const AQI_RANGES = [0, 50, 100, 150, 200, 300, 500];

function aqiToValue(index) {
  const mid = (AQI_RANGES[index - 1] + AQI_RANGES[index]) / 2;
  return Math.round(mid);
}

const UV_LABELS = ['', '低', '中等', '高', '很高', '極高'];
const UV_CLASSES = ['', 'low', 'moderate', 'high', 'veryhigh', 'extreme'];

function getUVLevel(uv) {
  if (uv <= 2) return 1;
  if (uv <= 5) return 2;
  if (uv <= 7) return 3;
  if (uv <= 10) return 4;
  return 5;
}

async function fetchWeather(loc) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${loc.lat},${loc.lon}&days=1&aqi=yes&lang=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderCard(data, locName) {
  const current = data.current;
  const day = data.forecast.forecastday[0];
  const hours = day.hour;
  const now = new Date();
  const currentHour = now.getHours();

  const aqiIndex = current.air_quality['us-epa-index'] || 1;
  const aqiVal = aqiToValue(aqiIndex);
  const uvVal = Math.round(current.uv);
  const uvLevel = getUVLevel(current.uv);

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <h2>${locName}</h2>
    <img src="https:${current.condition.icon}" alt="${toTW(current.condition.text)}">
    <span class="condition-text">${toTW(current.condition.text)}</span>
  `;
  card.appendChild(header);

  const tempSection = document.createElement('div');
  tempSection.className = 'temp-section';
  tempSection.innerHTML = `
    <div class="temp-current">${Math.round(current.temp_c)}<span class="unit">°C</span></div>
    <div class="temp-detail">
      <span class="feels-like">體感 ${Math.round(current.feelslike_c)}°C</span>
      <span class="high">↑ ${Math.round(day.day.maxtemp_c)}°C</span>
      <span class="low">↓ ${Math.round(day.day.mintemp_c)}°C</span>
    </div>
  `;
  card.appendChild(tempSection);

  const rainTitle = document.createElement('div');
  rainTitle.className = 'section-title';
  rainTitle.textContent = '降雨機率';
  card.appendChild(rainTitle);

  const chart = document.createElement('div');
  chart.className = 'rain-chart';

  const hoursToShow = 12;
  const startHour = currentHour;
  for (let i = 0; i < hoursToShow; i++) {
    const hourIdx = (startHour + i) % 24;
    const h = hours[hourIdx];
    const pop = h.chance_of_rain;
    const wrap = document.createElement('div');
    wrap.className = 'rain-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'rain-bar';
    bar.style.height = pop + '%';
    const label = document.createElement('div');
    label.className = 'rain-label';
    label.textContent = pop + '%';
    wrap.appendChild(bar);
    wrap.appendChild(label);
    chart.appendChild(wrap);
  }
  card.appendChild(chart);

  const labels = document.createElement('div');
  labels.className = 'rain-labels';
  for (let i = 0; i < hoursToShow; i++) {
    const h = (startHour + i) % 24;
    const span = document.createElement('span');
    span.textContent = h + ':00';
    labels.appendChild(span);
  }
  card.appendChild(labels);

  const uvSection = document.createElement('div');
  uvSection.className = 'uv-section';
  uvSection.innerHTML = `
    <div class="section-title">紫外線指數</div>
    <div class="uv-display">
      <span class="uv-value">${uvVal}</span>
      <span class="uv-level ${UV_CLASSES[uvLevel]}">${UV_LABELS[uvLevel]}</span>
    </div>
  `;
  card.appendChild(uvSection);

  const aqSection = document.createElement('div');
  aqSection.className = 'aq-section';
  const aq = current.air_quality;
  aqSection.innerHTML = `
    <div class="section-title">空氣品質</div>
    <div class="aqi-display">
      <span class="aqi-badge">AQI ${aqiVal}</span>
      <span class="aqi-level ${AQI_CLASSES[aqiIndex]}">${AQI_LABELS[aqiIndex]}</span>
    </div>
    <div class="aq-grid">
      <div class="aq-item"><span class="label">PM2.5</span><span class="value">${aq.pm2_5?.toFixed(1) ?? '-'} µg/m³</span></div>
      <div class="aq-item"><span class="label">PM10</span><span class="value">${aq.pm10?.toFixed(1) ?? '-'} µg/m³</span></div>
      <div class="aq-item"><span class="label">O₃</span><span class="value">${aq.o3?.toFixed(1) ?? '-'} µg/m³</span></div>
      <div class="aq-item"><span class="label">NO₂</span><span class="value">${aq.no2?.toFixed(1) ?? '-'} µg/m³</span></div>
      <div class="aq-item"><span class="label">CO</span><span class="value">${aq.co?.toFixed(1) ?? '-'} µg/m³</span></div>
      <div class="aq-item"><span class="label">SO₂</span><span class="value">${aq.so2?.toFixed(1) ?? '-'} µg/m³</span></div>
    </div>
  `;
  card.appendChild(aqSection);

  return card;
}

function updateTime() {
  const now = new Date();
  document.getElementById('updateTime').textContent = '最後更新：' + now.toLocaleString('zh-TW');
}

async function fetchAllWeather() {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const results = await Promise.all(LOCATIONS.map(loc => fetchWeather(loc)));
    container.innerHTML = '';
    results.forEach((data, i) => {
      const card = renderCard(data, LOCATIONS[i].name);
      container.appendChild(card);
    });
    updateTime();
  } catch (err) {
    container.innerHTML = `<div class="loading">載入失敗：${err.message}</div>`;
  }
}

fetchAllWeather();
setInterval(fetchAllWeather, 30 * 60 * 1000);
