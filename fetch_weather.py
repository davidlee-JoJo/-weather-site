#!/usr/bin/env python3
import json, os, urllib.request, urllib.parse, sys

API_KEY = os.environ.get('CWA_KEY', '')
if not API_KEY:
    print('ERROR: CWA_API_KEY not set', file=sys.stderr)
    sys.exit(1)

LOCATIONS = [
    ('台北北投', '台北市', '北投區'),
    ('新北汐止', '新北市', '汐止區'),
    ('嘉義太保', '嘉義縣', '太保市'),
    ('台北中山', '台北市', '中山區'),
    ('台北南港', '台北市', '南港區'),
    ('新北三重', '新北市', '三重區'),
    ('桃園南崁', '桃園市', '蘆竹區'),
]

BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-001'
ELEMENTS = '溫度,3小時降雨機率,天氣現象,體感溫度,相對濕度'
TIMEOUT = 30

def fetch_county(county):
    params = urllib.parse.urlencode({'Authorization': API_KEY, 'locationName': county, 'elementName': ELEMENTS})
    url = f'{BASE_URL}?{params}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read())

def find_location(raw_data, town_name):
    for loc in raw_data.get('records', {}).get('Locations', []):
        for item in loc.get('Location', []):
            if item.get('LocationName') == town_name:
                return item
    return None

def extract_element(location, element_name):
    for el in location.get('WeatherElement', []):
        if el.get('ElementName') == element_name:
            return el.get('Time', [])
    return []

def build_cwa_data(location):
    temps = extract_element(location, '溫度')
    pops = extract_element(location, '3小時降雨機率')
    weathers = extract_element(location, '天氣現象')
    feels = extract_element(location, '體感溫度')
    humidity_list = extract_element(location, '相對濕度')

    hours = []
    for t in temps:
        dt_str = t['DataTime']
        temp_val = t['ElementValue'][0]['Temperature']

        pop_val = '0'
        for p in pops:
            s_h = int(p['StartTime'][11:13])
            e_h = int(p['EndTime'][11:13])
            c_h = int(dt_str[11:13])
            if s_h <= c_h < e_h:
                pop_val = p['ElementValue'][0].get('ProbabilityOfPrecipitation', '0')
                break

        weather_text = ''
        for w in weathers:
            s_h = int(w['StartTime'][11:13])
            e_h = int(w['EndTime'][11:13])
            c_h = int(dt_str[11:13])
            if s_h <= c_h < e_h:
                weather_text = w['ElementValue'][0].get('Weather', '')
                break

        feels_val = ''
        for f in feels:
            if f.get('DataTime', '') == dt_str:
                feels_val = f['ElementValue'][0].get('ApparentTemperature', '')
                break

        hum_val = ''
        for h_item in humidity_list:
            if h_item.get('DataTime', '') == dt_str:
                hum_val = h_item['ElementValue'][0].get('RelativeHumidity', '')
                break

        hours.append({'time': dt_str, 'temp': temp_val, 'pop': pop_val,
                      'weather': weather_text, 'feels': feels_val, 'humidity': hum_val})

    today_day = {'maxtemp': None, 'mintemp': None}
    if temps:
        today_str = temps[0]['DataTime'][:10]
        today_temps = [t for t in temps if t['DataTime'][:10] == today_str]
        vals = [int(t['ElementValue'][0]['Temperature']) for t in today_temps if t['ElementValue'][0]['Temperature']]
        if vals:
            today_day['maxtemp'] = str(max(vals))
            today_day['mintemp'] = str(min(vals))

    return {'hours': hours, 'day': today_day}

results = []
for name, county, town in LOCATIONS:
    try:
        raw = fetch_county(county)
        loc = find_location(raw, town)
        if loc:
            data = build_cwa_data(loc)
            results.append({'name': name, 'data': data})
            print(f'Fetched {name} ({county}/{town})')
        else:
            print(f'ERROR: {name} ({county}/{town}) not found', file=sys.stderr)
    except Exception as e:
        print(f'ERROR fetching {name} ({county}/{town}): {e}', file=sys.stderr)

if not results:
    print('ERROR: no data fetched', file=sys.stderr)
    sys.exit(1)

with open('weather-data.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f'Done, {len(results)} locations')
