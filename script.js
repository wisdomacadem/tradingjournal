const form = document.getElementById('tradeForm');
const tableBody = document.getElementById('tradeTable');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetBtn');

let trades = JSON.parse(localStorage.getItem('trades')) || [
  {
    id: crypto.randomUUID(),
    symbol: 'MNQ', direction: 'Long', result: 'Win', entry: 21500, exit: 21540,
    pnl: 800, date: new Date().toISOString().slice(0, 10), strategy: 'Opening range breakout',
    screenshot: '', notes: 'Followed plan. Strong candle confirmation.'
  },
  {
    id: crypto.randomUUID(),
    symbol: 'MGC', direction: 'Short', result: 'Loss', entry: 2350, exit: 2356,
    pnl: -60, date: new Date().toISOString().slice(0, 10), strategy: 'VWAP rejection',
    screenshot: '', notes: 'Entered too early before confirmation.'
  }
];

let chart;

document.getElementById('date').value = new Date().toISOString().slice(0, 10);

function saveTrades() {
  localStorage.setItem('trades', JSON.stringify(trades));
}

function money(value) {
  return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function updateStats() {
  const total = trades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
  const wins = trades.filter(trade => trade.pnl > 0).length;
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : 0;
  const best = trades.length ? Math.max(...trades.map(trade => Number(trade.pnl))) : 0;

  document.getElementById('totalPnL').textContent = money(total);
  document.getElementById('winRate').textContent = `${winRate}%`;
  document.getElementById('totalTrades').textContent = trades.length;
  document.getElementById('bestTrade').textContent = money(best);
}

function renderTable() {
  const query = searchInput.value.toLowerCase();
  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(query) ||
    trade.strategy.toLowerCase().includes(query)
  );

  tableBody.innerHTML = filteredTrades.map(trade => `
    <tr>
      <td>${trade.date}</td>
      <td><strong>${trade.symbol}</strong>${trade.screenshot ? `<br><a class="screenshot-link" href="${trade.screenshot}" target="_blank">Chart</a>` : ''}</td>
      <td>${trade.direction}</td>
      <td>${trade.result}</td>
      <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${money(trade.pnl)}</td>
      <td>${trade.strategy || '—'}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editTrade('${trade.id}')">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteTrade('${trade.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderChart() {
  const ctx = document.getElementById('pnlChart');
  const labels = trades.map(trade => `${trade.symbol} ${trade.date}`);
  const data = trades.map(trade => Number(trade.pnl));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Profit / Loss',
        data,
        backgroundColor: data.map(value => value >= 0 ? 'rgba(46,229,157,.75)' : 'rgba(255,92,122,.75)'),
        borderColor: data.map(value => value >= 0 ? 'rgba(46,229,157,1)' : 'rgba(255,92,122,1)'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#eef3ff' } } },
      scales: {
        x: { ticks: { color: '#9eadc9' }, grid: { color: 'rgba(255,255,255,.06)' } },
        y: { ticks: { color: '#9eadc9' }, grid: { color: 'rgba(255,255,255,.06)' } }
      }
    }
  });
}

function refreshApp() {
  saveTrades();
  updateStats();
  renderTable();
  renderChart();
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const trade = {
    id: document.getElementById('tradeId').value || crypto.randomUUID(),
    symbol: document.getElementById('symbol').value.trim().toUpperCase(),
    direction: document.getElementById('direction').value,
    result: document.getElementById('result').value,
    entry: Number(document.getElementById('entry').value),
    exit: Number(document.getElementById('exit').value),
    pnl: Number(document.getElementById('pnl').value),
    date: document.getElementById('date').value,
    strategy: document.getElementById('strategy').value.trim(),
    screenshot: document.getElementById('screenshot').value.trim(),
    notes: document.getElementById('notes').value.trim()
  };

  const existingIndex = trades.findIndex(item => item.id === trade.id);
  if (existingIndex >= 0) {
    trades[existingIndex] = trade;
  } else {
    trades.unshift(trade);
  }

  form.reset();
  document.getElementById('tradeId').value = '';
  document.getElementById('date').value = new Date().toISOString().slice(0, 10);
  refreshApp();
});

function editTrade(id) {
  const trade = trades.find(item => item.id === id);
  if (!trade) return;

  document.getElementById('tradeId').value = trade.id;
  document.getElementById('symbol').value = trade.symbol;
  document.getElementById('direction').value = trade.direction;
  document.getElementById('result').value = trade.result;
  document.getElementById('entry').value = trade.entry;
  document.getElementById('exit').value = trade.exit;
  document.getElementById('pnl').value = trade.pnl;
  document.getElementById('date').value = trade.date;
  document.getElementById('strategy').value = trade.strategy;
  document.getElementById('screenshot').value = trade.screenshot;
  document.getElementById('notes').value = trade.notes;

  document.getElementById('add-trade').scrollIntoView({ behavior: 'smooth' });
}

function deleteTrade(id) {
  const confirmed = confirm('Delete this trade?');
  if (!confirmed) return;
  trades = trades.filter(trade => trade.id !== id);
  refreshApp();
}

resetBtn.addEventListener('click', () => {
  form.reset();
  document.getElementById('tradeId').value = '';
  document.getElementById('date').value = new Date().toISOString().slice(0, 10);
});

searchInput.addEventListener('input', renderTable);

refreshApp();
