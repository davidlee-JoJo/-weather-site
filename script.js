const DATA_URL = 'weather-data.json';

function getCurrentTimeIndex(hours) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < hours.length; i++) {
    const h = parseInt(hours[i].time.substring(11, 13));
    const diff = Math.abs((h - currentHour) * 60 + currentMinute);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function renderCard(item, locName) {
  const data = item.data;
  const hours = data.hours;
  if (!hours || hours.length === 0) return;

  const nowIdx = getCurrentTimeIndex(hours);
  const current = hours[nowIdx];
  const currentHour = parseInt(current.time.substring(11, 13));
  const isDay = currentHour >= 6 && currentHour < 18;

  const temp = current.temp || '--';
  const feels = current.feels || '--';
  const weather = current.weather || '--';
  const pop = current.pop || '0';
  const humidity = current.humidity || '--';
  const high = data.day?.maxtemp || '--';
  const low = data.day?.mintemp || '--';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <h2>${locName}</h2>
    <div class="weather-icon">${getWeatherIcon(weather, isDay)}</div>
    <span class="condition-text">${weather}</span>
  `;
  card.appendChild(header);

  const tempSection = document.createElement('div');
  tempSection.className = 'temp-section';
  tempSection.innerHTML = `
    <div class="temp-current">${temp}<span class="unit">°C</span></div>
    <div class="temp-detail">
      <span class="feels-like">體感 ${feels}°C</span>
      <span class="high">↑ ${high}°C</span>
      <span class="low">↓ ${low}°C</span>
    </div>
  `;
  card.appendChild(tempSection);

  const details = document.createElement('div');
  details.className = 'detail-row';
  details.innerHTML = `
    <div class="detail-item">
      <span class="detail-label">降雨機率</span>
      <span class="detail-value">${pop}%</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">相對濕度</span>
      <span class="detail-value">${humidity}%</span>
    </div>
  `;
  card.appendChild(details);

  const rainTitle = document.createElement('div');
  rainTitle.className = 'section-title';
  rainTitle.textContent = '未來12小時降雨機率';
  card.appendChild(rainTitle);

  const chart = document.createElement('div');
  chart.className = 'rain-chart';

  const hoursToShow = 12;
  for (let i = 0; i < hoursToShow && (nowIdx + i) < hours.length; i++) {
    const h = hours[nowIdx + i];
    const popVal = parseInt(h.pop) || 0;
    const hourLabel = h.time.substring(11, 16);
    const wrap = document.createElement('div');
    wrap.className = 'rain-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'rain-bar';
    bar.style.height = popVal + '%';
    const label = document.createElement('div');
    label.className = 'rain-label';
    label.textContent = popVal + '%';
    wrap.appendChild(bar);
    wrap.appendChild(label);
    chart.appendChild(wrap);
  }
  card.appendChild(chart);

  const labels = document.createElement('div');
  labels.className = 'rain-labels';
  for (let i = 0; i < hoursToShow && (nowIdx + i) < hours.length; i++) {
    const h = hours[nowIdx + i];
    const span = document.createElement('span');
    span.textContent = h.time.substring(11, 16);
    labels.appendChild(span);
  }
  card.appendChild(labels);

  return card;
}

function getWeatherIcon(weather, isDay) {
  const prefix = isDay ? 'day' : 'night';
  if (weather.includes('晴')) return `☀️`;
  if (weather.includes('雲')) return `⛅`;
  if (weather.includes('雨') || weather.includes('陣')) return `🌧️`;
  if (weather.includes('陰')) return `☁️`;
  if (weather.includes('雷')) return `⛈️`;
  return `🌤️`;
}

function updateTime() {
  const now = new Date();
  document.getElementById('updateTime').textContent = '最後更新：' + now.toLocaleString('zh-TW');
}

async function fetchAllWeather() {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '<div class="loading">載入中...</div>';

  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const results = await res.json();
    container.innerHTML = '';
    results.forEach(item => {
      const card = renderCard(item, item.name);
        container.appendChild(card);
    });
    const updateEl = document.getElementById('updateTime');
    const now = new Date();
    updateEl.textContent = '資料更新：' + now.toLocaleString('zh-TW');
  } catch (err) {
    container.innerHTML = `<div class="loading">載入失敗：${err.message}</div>`;
  }
}

fetchAllWeather();
setInterval(fetchAllWeather, 15 * 60 * 1000);
