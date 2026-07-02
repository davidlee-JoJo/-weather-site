const DATA_URL = 'weather-data.json';

function renderCard(item, locName) {
  const data = item.data;
  const day = data.day;
  const hours = data.hours || [];

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <h2>${locName}</h2>
    <div class="weather-icon">${getWeatherIcon(day.weather)}</div>
    <span class="condition-text">${day.weather}</span>
  `;
  card.appendChild(header);

  const tempSection = document.createElement('div');
  tempSection.className = 'temp-section';
  tempSection.innerHTML = `
    <div class="temp-current">${day.maxtemp}<span class="unit">°C</span></div>
    <div class="temp-detail">
      <span class="high">↑ ${day.maxtemp}°C</span>
      <span class="low">↓ ${day.mintemp}°C</span>
    </div>
  `;
  card.appendChild(tempSection);

  const details = document.createElement('div');
  details.className = 'detail-row';
  details.innerHTML = `
    <div class="detail-item">
      <span class="detail-label">降雨機率</span>
      <span class="detail-value">${day.pop}%</span>
    </div>
  `;
  card.appendChild(details);

  if (hours.length > 0) {
    const rainTitle = document.createElement('div');
    rainTitle.className = 'section-title';
    rainTitle.textContent = '未來36小時天氣與降雨機率';
    card.appendChild(rainTitle);

    const chart = document.createElement('div');
    chart.className = 'rain-chart';

    hours.forEach(h => {
      const popVal = parseInt(h.pop) || 0;
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
    });
    card.appendChild(chart);

    const labels = document.createElement('div');
    labels.className = 'rain-labels';
    hours.forEach(h => {
      const span = document.createElement('span');
      const start = h.startTime.substring(5, 10) + ' ' + h.startTime.substring(11, 16);
      span.textContent = start;
      labels.appendChild(span);
    });
    card.appendChild(labels);
  }

  return card;
}

function getWeatherIcon(weather) {
  if (!weather) return '🌤️';
  if (weather.includes('晴')) return '☀️';
  if (weather.includes('多雲')) return '⛅';
  if (weather.includes('雨') || weather.includes('陣')) return '🌧️';
  if (weather.includes('陰')) return '☁️';
  if (weather.includes('雷')) return '⛈️';
  return '🌤️';
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
      if (card) container.appendChild(card);
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
