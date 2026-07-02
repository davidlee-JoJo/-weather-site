#!/usr/bin/env python3
import json, os, urllib.request, urllib.parse, sys

API_KEY = os.environ.get('CWA_KEY', '')
if not API_KEY:
    print('ERROR: CWA_API_KEY not set', file=sys.stderr)
    sys.exit(1)

LOCATIONS = [
    ('臺北市', '臺北市'),
    ('新北市', '新北市'),
    ('嘉義縣', '嘉義縣'),
    ('桃園市', '桃園市'),
]

BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001'
TIMEOUT = 30

def fetch_county(county):
    params = urllib.parse.urlencode({'Authorization': API_KEY, 'locationName': county})
    url = f'{BASE_URL}?{params}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read())

def get_element(data, element_name):
    for el in data.get('weatherElement', []):
        if el.get('elementName') == element_name:
            return el.get('time', [])
    return []

results = []
for display_name, county in LOCATIONS:
    try:
        raw = fetch_county(county)
        loc_list = raw.get('records', {}).get('location', [])
        if not loc_list:
            print(f'ERROR: {county} not found', file=sys.stderr)
            continue
        loc = loc_list[0]

        wx_times = get_element(loc, 'Wx')
        pop_times = get_element(loc, 'PoP')
        mint_times = get_element(loc, 'MinT')
        maxt_times = get_element(loc, 'MaxT')

        mint = mint_times[0]['parameter']['parameterName'] if mint_times else '--'
        maxt = maxt_times[0]['parameter']['parameterName'] if maxt_times else '--'
        wx = wx_times[0]['parameter']['parameterName'] if wx_times else '--'
        pop = pop_times[0]['parameter']['parameterName'] if pop_times else '0'

        hours = []
        if wx_times:
            for wt in wx_times:
                st = wt['startTime']
                et = wt['endTime']
                wx_name = wt['parameter']['parameterName']
                pop_val = '0'
                for pt in pop_times:
                    if pt['startTime'] == st and pt['endTime'] == et:
                        pop_val = pt['parameter']['parameterName']
                        break
                hours.append({
                    'startTime': st,
                    'endTime': et,
                    'weather': wx_name,
                    'pop': pop_val
                })

        data = {
            'hours': hours,
            'day': {
                'maxtemp': maxt,
                'mintemp': mint,
                'weather': wx,
                'pop': pop
            }
        }
        results.append({'name': display_name, 'data': data})
        print(f'Fetched {display_name}')
    except Exception as e:
        print(f'ERROR fetching {display_name}: {e}', file=sys.stderr)

if not results:
    print('ERROR: no data fetched', file=sys.stderr)
    sys.exit(1)

with open('weather-data.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f'Done, {len(results)} locations')
