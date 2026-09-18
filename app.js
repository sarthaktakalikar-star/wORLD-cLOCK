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

let selected = JSON.parse(localStorage.getItem('orbit-cities') || 'null') || ['new-york', 'london', 'mumbai', 'tokyo'];
const grid = document.querySelector('#clockGrid');
const dateLabel = document.querySelector('#dateLabel');
const utcLabel = document.querySelector('#utcLabel');
const localLabel = document.querySelector('#localLabel');
const count = document.querySelector('#clockCount');
const dialog = document.querySelector('#cityDialog');
const options = document.querySelector('#cityOptions');
const search = document.querySelector('#citySearch');

const formatParts = (zone, parts = ['hour', 'minute', 'second']) => {
  const values = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour12: false, ...Object.fromEntries(parts.map(p => [p, p])) }).formatToParts(new Date());
  return Object.fromEntries(values.filter(({ type }) => parts.includes(type)).map(({ type, value }) => [type, value]));
};
const offset = zone => {
  const text = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT';
  return text.replace('GMT', 'UTC') || 'UTC';
};
const isDay = zone => Number(formatParts(zone, ['hour']).hour) >= 7 && Number(formatParts(zone, ['hour']).hour) < 19;
const getLocalDate = zone => new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

function render() {
  const now = new Date();
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  dateLabel.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  utcLabel.textContent = `UTC ${offset('UTC').replace('UTC', '+00:00')}`;
  localLabel.textContent = `Your local time · ${localZone.replaceAll('_', ' ')}`;
  count.textContent = String(selected.length).padStart(2, '0');
  grid.innerHTML = selected.map(id => cities.find(c => c.id === id)).filter(Boolean).map(city => {
    const parts = formatParts(city.zone);
    const day = isDay(city.zone);
    return `<article class="clock-card" style="--card-glow: ${city.glow}">
      <div class="card-top"><div><h3 class="city">${city.city}</h3><p class="country">${city.country}</p></div><button class="remove-city" data-remove="${city.id}" aria-label="Remove ${city.city}">×</button></div>
      <div class="clock-time">${parts.hour}:${parts.minute}<span class="clock-seconds">:${parts.second}</span></div>
      <div class="day-state"><span class="state-icon">${day ? '☼' : '☾'}</span>${day ? 'Daylight' : 'Nighttime'} · ${getLocalDate(city.zone)}</div>
      <div class="card-footer"><span>${city.zone.split('/').pop().replaceAll('_', ' ')}</span><span class="offset">${offset(city.zone)}</span></div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => removeCity(button.dataset.remove)));
}
function removeCity(id) { if (selected.length <= 1) return; selected = selected.filter(city => city !== id); save(); render(); populateOptions(search.value); }
function save() { localStorage.setItem('orbit-cities', JSON.stringify(selected)); }
function populateOptions(query = '') { const q = query.toLowerCase(); options.innerHTML = cities.filter(c => !selected.includes(c.id) && `${c.city} ${c.country}`.toLowerCase().includes(q)).map(c => `<button class="city-option" data-add="${c.id}"><span>${c.city}</span><small>${c.country}</small></button>`).join('') || '<p class="dialog-copy">No new cities found.</p>'; document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { selected.push(b.dataset.add); save(); render(); populateOptions(search.value); })); }

document.querySelector('#addCityButton').addEventListener('click', () => { populateOptions(); dialog.showModal(); setTimeout(() => search.focus(), 50); });
document.querySelector('#themeButton').addEventListener('click', () => document.body.classList.toggle('warm-mode'));
search.addEventListener('input', e => populateOptions(e.target.value));
render();
setInterval(render, 1000);
