const LOCATIONS = [
  { name: '台北北投', lat: '25.1167', lon: '121.5167' },
  { name: '新北汐止', lat: '25.0667', lon: '121.6333' },
  { name: '新北三重', lat: '25.0667', lon: '121.4667' },
  { name: '台北中山', lat: '25.0667', lon: '121.5333' },
  { name: '台北南港', lat: '25.0500', lon: '121.6000' },
  { name: '桃園蘆竹', lat: '25.0500', lon: '121.3000' },
  { name: '嘉義太保', lat: '23.4667', lon: '120.3333' },
];

async function fetchLocation(name, lat, lon, apiKey) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1&aqi=yes&lang=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI returned ${res.status} for ${name}`);
  const data = await res.json();
  return { name, data };
}

async function handleScheduled(event, env) {
  const apiKey = env.WEATHER_API_KEY;
  if (!apiKey) {
    console.error('WEATHER_API_KEY not set');
    return;
  }

  const results = [];
  for (const loc of LOCATIONS) {
    try {
      const item = await fetchLocation(loc.name, loc.lat, loc.lon, apiKey);
      results.push(item);
      console.log(`Fetched ${loc.name}`);
    } catch (e) {
      console.error(`Failed to fetch ${loc.name}: ${e.message}`);
    }
  }

  await env.WEATHER_KV.put('weather-data', JSON.stringify(results));
  console.log('Weather data stored in KV');
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/refresh') {
    await handleScheduled(null, env);
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (url.pathname === '/api/weather') {
    const data = await env.WEATHER_KV.get('weather-data', 'json');
    if (!data) {
      return new Response(JSON.stringify({ error: 'No data available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
  async scheduled(event, env, ctx) {
    return handleScheduled(event, env);
  },
};
