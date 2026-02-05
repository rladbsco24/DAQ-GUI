const toggleButtons = document.querySelectorAll('.valve-btn, .toggle-btn');

const valveTagMap = {
  gcfv: { tag: document.getElementById('tag-gcfv'), state: document.getElementById('state-gcfv') },
  gcov: { tag: document.getElementById('tag-gcov'), state: document.getElementById('state-gcov') },
  mfv: { tag: document.getElementById('tag-mfv'), state: document.getElementById('state-mfv') },
  mov: { tag: document.getElementById('tag-mov'), state: document.getElementById('state-mov') },
};

const toggleState = (button) => {
  const isOn = button.dataset.state === 'on';
  const nextState = isOn ? 'off' : 'on';
  button.dataset.state = nextState;
  button.classList.toggle('on', nextState === 'on');
  button.classList.toggle('off', nextState === 'off');
  const label = button.querySelector('span');
  if (label) {
    label.textContent = nextState.toUpperCase();
  }
  button.setAttribute('aria-pressed', nextState === 'on');
  const valveKey = button.dataset.valve;
  if (valveKey && valveTagMap[valveKey]) {
    const { tag, state } = valveTagMap[valveKey];
    if (tag) {
      tag.classList.toggle('on', nextState === 'on');
      tag.classList.toggle('off', nextState === 'off');
    }
    if (state) {
      state.classList.toggle('on', nextState === 'on');
      state.classList.toggle('off', nextState === 'off');
      state.textContent = nextState.toUpperCase();
    }
  }
};

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => toggleState(button));
});

const sensorConfig = [
  { id: 'sensor-p1', label: 'P1', min: 0.4, max: 1.4, unit: ' bar' },
  { id: 'sensor-p2', label: 'P2', min: 0.4, max: 1.4, unit: ' bar' },
  { id: 'sensor-p3', label: 'P3', min: 0.2, max: 1.1, unit: ' bar' },
  { id: 'sensor-p4', label: 'P4', min: 0.2, max: 1.1, unit: ' bar' },
  { id: 'sensor-t1', label: 'T1', min: 10, max: 25, unit: '℃', decimals: 1 },
  { id: 'sensor-t2', label: 'T2', min: 10, max: 25, unit: '℃', decimals: 1 },
  { id: 'sensor-t3', label: 'T3', min: 5, max: 20, unit: '℃', decimals: 1 },
  { id: 'sensor-dp1', label: 'DP1', min: 0.1, max: 4.5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-dp2', label: 'DP2', min: 0.1, max: 4.5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-flow1', label: '', min: 0.1, max: 0.9, unit: ' g/s', decimals: 2 },
  { id: 'sensor-flow2', label: '', min: 0.1, max: 0.9, unit: ' g/s', decimals: 2 },
  { id: 'sensor-l1', label: 'L1', min: 0.2, max: 4.5, unit: ' N', decimals: 2 },
  { id: 'sensor-p5', label: 'P5', min: 0.3, max: 1.1, unit: ' bar' },
  { id: 'sensor-p6', label: 'P6', min: 0.3, max: 1.1, unit: ' bar' },
];

const sensorTargets = sensorConfig
  .map((item) => ({ ...item, node: document.getElementById(item.id) }))
  .filter((item) => item.node);

const randomValue = (min, max) => Math.random() * (max - min) + min;

const sensorState = new Map();
sensorConfig.forEach((sensor) => {
  sensorState.set(sensor.id, randomValue(sensor.min, sensor.max));
});

const formatValue = (value, decimals = 2) => value.toFixed(decimals);

const updateSensors = () => {
  sensorTargets.forEach((sensor) => {
    const decimals = sensor.decimals ?? 2;
    const previous = sensorState.get(sensor.id) ?? sensor.min;
    const drift = randomValue(-0.05, 0.05);
    const next = Math.min(sensor.max, Math.max(sensor.min, previous + drift));
    sensorState.set(sensor.id, next);
    const value = formatValue(next, decimals);
    const prefix = sensor.label ? `${sensor.label} ` : '';
    sensor.node.textContent = `${prefix}${value}${sensor.unit}`;
  });
};

updateSensors();
setInterval(updateSensors, 1200);

const chartConfig = {
  p1: { label: 'P1', unit: 'bar', min: 0.4, max: 1.4, sensorId: 'sensor-p1' },
  p2: { label: 'P2', unit: 'bar', min: 0.4, max: 1.4, sensorId: 'sensor-p2' },
  p3: { label: 'P3', unit: 'bar', min: 0.2, max: 1.1, sensorId: 'sensor-p3' },
  p4: { label: 'P4', unit: 'bar', min: 0.2, max: 1.1, sensorId: 'sensor-p4' },
  t1: { label: 'T1', unit: '℃', min: 10, max: 25, sensorId: 'sensor-t1' },
  t2: { label: 'T2', unit: '℃', min: 10, max: 25, sensorId: 'sensor-t2' },
  dp1: { label: 'DP1', unit: 'kPa', min: 0.1, max: 4.5, sensorId: 'sensor-dp1' },
  dp2: { label: 'DP2', unit: 'kPa', min: 0.1, max: 4.5, sensorId: 'sensor-dp2' },
  flow1: { label: 'Flow-1', unit: 'g/s', min: 0.1, max: 0.9, sensorId: 'sensor-flow1' },
  flow2: { label: 'Flow-2', unit: 'g/s', min: 0.1, max: 0.9, sensorId: 'sensor-flow2' },
};

const chartButtons = document.querySelectorAll('.chart-btn');
const chartTitle = document.querySelector('.chart-title');
const chartUnit = document.querySelector('.chart-unit');
const chartValue = document.getElementById('chart-latest');
const chartCanvas = document.getElementById('trend-chart');
const fftCanvas = document.getElementById('fft-chart');
const phaseCanvas = document.getElementById('phase-chart');
const spectrogramCanvas = document.getElementById('spectrogram-chart');

const chartState = {
  selected: 'p1',
  data: Array.from({ length: 40 }, () => 0),
};

const drawChart = () => {
  if (!chartCanvas) {
    return;
  }
  const ctx = chartCanvas.getContext('2d');
  const { width, height } = chartCanvas;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(77, 178, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  chartState.data.forEach((value, index) => {
    const x = (width / (chartState.data.length - 1)) * index;
    const y = height - value * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
};

const drawFFT = () => {
  if (!fftCanvas) {
    return;
  }
  const ctx = fftCanvas.getContext('2d');
  const { width, height } = fftCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(15, 15, 24, 0.95)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const bars = 48;
  const barWidth = width / bars;
  ctx.fillStyle = 'rgba(255, 159, 64, 0.9)';
  for (let i = 0; i < bars; i += 1) {
    const amp = Math.max(0.05, Math.sin((i / bars) * Math.PI * 6) * 0.4 + Math.random() * 0.3);
    const barHeight = amp * height;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.6, barHeight);
  }
};

const drawPhase = () => {
  if (!phaseCanvas) {
    return;
  }
  const ctx = phaseCanvas.getContext('2d');
  const { width, height } = phaseCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(12, 12, 18, 0.95)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 165, 0, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const points = 180;
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * Math.PI * 2;
    const x = width / 2 + Math.cos(t) * (width * 0.28) + Math.cos(t * 2) * 12;
    const y = height / 2 + Math.sin(t * 1.2) * (height * 0.28);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
};

const drawSpectrogram = () => {
  if (!spectrogramCanvas) {
    return;
  }
  const ctx = spectrogramCanvas.getContext('2d');
  const { width, height } = spectrogramCanvas;
  ctx.clearRect(0, 0, width, height);
  const columns = 80;
  const rows = 40;
  const colWidth = width / columns;
  const rowHeight = height / rows;
  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const intensity = Math.max(0, Math.sin((x / columns) * Math.PI * 2) * 0.5 + Math.random() * 0.5);
      const hue = 260 - intensity * 200;
      const light = 20 + intensity * 50;
      ctx.fillStyle = `hsl(${hue}, 90%, ${light}%)`;
      ctx.fillRect(x * colWidth, y * rowHeight, colWidth + 1, rowHeight + 1);
    }
  }
};

const updateChartMeta = () => {
  const config = chartConfig[chartState.selected];
  if (!config) {
    return;
  }
  if (chartTitle) chartTitle.textContent = config.label;
  if (chartUnit) chartUnit.textContent = config.unit;
};

const pushChartValue = () => {
  const config = chartConfig[chartState.selected];
  if (!config) {
    return;
  }
  const source = sensorState.get(config.sensorId ?? '') ?? randomValue(config.min, config.max);
  const raw = source;
  const normalized = (raw - config.min) / (config.max - config.min);
  chartState.data.push(Math.min(Math.max(normalized, 0), 1));
  chartState.data.shift();
  if (chartValue) {
    chartValue.textContent = raw.toFixed(2);
  }
  drawChart();
  drawFFT();
  drawPhase();
  drawSpectrogram();
};

if (chartButtons.length && chartCanvas) {
  chartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      chartButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      chartState.selected = button.dataset.sensor;
      updateChartMeta();
      chartState.data = Array.from({ length: 40 }, () => 0);
      pushChartValue();
    });
  });
  updateChartMeta();
  drawChart();
  drawFFT();
  drawPhase();
  drawSpectrogram();
  setInterval(pushChartValue, 1200);
}
