const cities = [
  { id: 'new-york', city: 'New York', country: 'United States', zone: 'America/New_York', glow: '#8b7bff' },
  { id: 'london', city: 'London', country: 'United Kingdom', zone: 'Europe/London', glow: '#6de3d2' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', zone: 'Asia/Kolkata', glow: '#ffb86b' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo', glow: '#f18bb9' },
  { id: 'los-angeles', city: 'Los Angeles', country: 'United States', zone: 'America/Los_Angeles', glow: '#ff9e8a' },
  { id: 'paris', city: 'Paris', country: 'France', zone: 'Europe/Paris', glow: '#9b8dff' },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', zone: 'Africa/Lagos', glow: '#f5d36a' },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', zone: 'Asia/Singapore', glow: '#63d4ff' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', zone: 'Australia/Sydney', glow: '#82d9ad' },
  { id: 'sao-paulo', city: 'São Paulo', country: 'Brazil', zone: 'America/Sao_Paulo', glow: '#d59dff' }
];

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
let selected = JSON.parse(localStorage.getItem('orbit-cities') || 'null') || ['new-york', 'london', 'mumbai', 'tokyo'];
let userCoordinates = JSON.parse(localStorage.getItem('orbit-coordinates') || 'null');
const grid = document.querySelector('#clockGrid'), dateLabel = document.querySelector('#dateLabel'), utcLabel = document.querySelector('#utcLabel'), localLabel = document.querySelector('#localLabel'), count = document.querySelector('#clockCount'), dialog = document.querySelector('#cityDialog'), options = document.querySelector('#cityOptions'), search = document.querySelector('#citySearch'), locationStatus = document.querySelector('#locationStatus');

const formatParts = (zone, parts = ['hour', 'minute', 'second']) => {
  const values = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour12: false, ...Object.fromEntries(parts.map(p => [p, p])) }).formatToParts(new Date());
  return Object.fromEntries(values.filter(({ type }) => parts.includes(type)).map(({ type, value }) => [type, value]));
};
const offset = zone => (new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT').replace('GMT', 'UTC');
const isDay = zone => { const hour = Number(formatParts(zone, ['hour']).hour); return hour >= 7 && hour < 19; };
const getDate = zone => new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
const niceZone = zone => zone.replaceAll('_', ' ').replaceAll('/', ' / ');

function localCard() {
  const parts = formatParts(localZone), day = isDay(localZone);
  const coordinateText = userCoordinates ? `${userCoordinates.latitude.toFixed(3)}°, ${userCoordinates.longitude.toFixed(3)}°` : 'Browser time-zone location';
  return `<article class="clock-card local-card" style="--card-glow: #6de3d2"><div class="card-top"><div><h3 class="city">You are here</h3><p class="country">${niceZone(localZone)}</p></div><span class="location-badge">LIVE</span></div><div class="clock-time">${parts.hour}:${parts.minute}<span class="clock-seconds">:${parts.second}</span></div><div class="day-state"><span class="state-icon">${day ? '☼' : '☾'}</span>${day ? 'Daylight' : 'Nighttime'} · ${getDate(localZone)}</div><div class="card-footer"><span>${coordinateText}</span><span class="offset">${offset(localZone)}</span></div></article>`;
}
function clockCard(city) {
  const parts = formatParts(city.zone), day = isDay(city.zone);
  return `<article class="clock-card" style="--card-glow: ${city.glow}"><div class="card-top"><div><h3 class="city">${city.city}</h3><p class="country">${city.country}</p></div><button class="remove-city" data-remove="${city.id}" aria-label="Remove ${city.city}">×</button></div><div class="clock-time">${parts.hour}:${parts.minute}<span class="clock-seconds">:${parts.second}</span></div><div class="day-state"><span class="state-icon">${day ? '☼' : '☾'}</span>${day ? 'Daylight' : 'Nighttime'} · ${getDate(city.zone)}</div><div class="card-footer"><span>${city.zone.split('/').pop().replaceAll('_', ' ')}</span><span class="offset">${offset(city.zone)}</span></div></article>`;
}
function render() {
  const now = new Date();
  dateLabel.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  utcLabel.textContent = `UTC ${offset('UTC').replace('UTC', '+00:00')}`;
  localLabel.textContent = `Your local time · ${niceZone(localZone)}`;
  count.textContent = String(selected.length).padStart(2, '0');
  grid.innerHTML = localCard() + selected.map(id => cities.find(c => c.id === id)).filter(Boolean).map(clockCard).join('');
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => removeCity(button.dataset.remove)));
}
function removeCity(id) { if (selected.length <= 1) return; selected = selected.filter(city => city !== id); save(); render(); populateOptions(search.value); }
function save() { localStorage.setItem('orbit-cities', JSON.stringify(selected)); }
function populateOptions(query = '') { const q = query.toLowerCase(); options.innerHTML = cities.filter(c => !selected.includes(c.id) && `${c.city} ${c.country}`.toLowerCase().includes(q)).map(c => `<button class="city-option" data-add="${c.id}"><span>${c.city}</span><small>${c.country}</small></button>`).join('') || '<p class="dialog-copy">No new cities found.</p>'; document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { selected.push(b.dataset.add); save(); render(); populateOptions(search.value); })); }
function requestLocation() {
  if (!navigator.geolocation) { locationStatus.textContent = 'Location access is not supported by this browser.'; return; }
  locationStatus.textContent = 'Requesting your location…';
  navigator.geolocation.getCurrentPosition(position => { userCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude }; localStorage.setItem('orbit-coordinates', JSON.stringify(userCoordinates)); locationStatus.textContent = `Location enabled · ${userCoordinates.latitude.toFixed(3)}°, ${userCoordinates.longitude.toFixed(3)}°`; render(); }, () => { locationStatus.textContent = 'Location permission was not granted. Showing your browser time zone instead.'; }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

document.querySelector('#addCityButton').addEventListener('click', () => { populateOptions(); dialog.showModal(); setTimeout(() => search.focus(), 50); });
document.querySelector('#locateButton').addEventListener('click', requestLocation);
document.querySelector('#themeButton').addEventListener('click', () => document.body.classList.toggle('warm-mode'));
search.addEventListener('input', e => populateOptions(e.target.value));
if (userCoordinates) locationStatus.textContent = `Location enabled · ${userCoordinates.latitude.toFixed(3)}°, ${userCoordinates.longitude.toFixed(3)}°`;
render();
setInterval(render, 1000);
