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

const formatSensorMarkup = (sensor, value) => {
  const decimals = sensor.decimals ?? 2;
  const labelText = sensor.label ? `<tspan class=\"sensor-label\">${sensor.label}</tspan> ` : '';
  const unitText = sensor.unit.trim();
  const unitSpan = unitText ? ` <tspan class=\"sensor-unit\">${unitText}</tspan>` : '';
  return `${labelText}<tspan class=\"sensor-value\">${formatValue(value, decimals)}</tspan>${unitSpan}`;
};

const updateSensors = () => {
  sensorTargets.forEach((sensor) => {
    const previous = sensorState.get(sensor.id) ?? sensor.min;
    const drift = randomValue(-0.05, 0.05);
    const next = Math.min(sensor.max, Math.max(sensor.min, previous + drift));
    sensorState.set(sensor.id, next);
    sensor.node.innerHTML = formatSensorMarkup(sensor, next);
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

const prepareCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
};

const chartState = {
  selected: 'p1',
  data: Array.from({ length: 40 }, () => 0),
  signal: [],
  spectrum: [],
  spectrogram: [],
  tick: 0,
};

const fftBins = 48;
const signalLength = 96;
const spectrogramColumns = 80;
const spectrogramRows = 40;

const buildSignal = (value, config) => {
  const normalized = (value - config.min) / (config.max - config.min);
  const base = 1.2 + normalized * 3.2;
  const amplitude = 0.4 + normalized * 0.45;
  const phase = chartState.tick * 0.2;
  const nextSignal = [];
  for (let i = 0; i < signalLength; i += 1) {
    const t = i / signalLength;
    const sample =
      amplitude * Math.sin(2 * Math.PI * base * t + phase) +
      0.18 * Math.sin(2 * Math.PI * base * 2.1 * t + phase * 0.7) +
      0.08 * Math.sin(2 * Math.PI * base * 3.3 * t + phase * 1.3);
    nextSignal.push(Math.max(-1, Math.min(1, sample)));
  }
  return nextSignal;
};

const computeSpectrum = (signal) => {
  const spectrum = [];
  for (let k = 0; k < fftBins; k += 1) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < signal.length; n += 1) {
      const angle = (2 * Math.PI * k * n) / signal.length;
      real += signal[n] * Math.cos(angle);
      imag -= signal[n] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imag * imag) / signal.length;
    spectrum.push(Math.min(1, magnitude * 3));
  }
  return spectrum;
};

const updateSpectrogram = (spectrum) => {
  const column = [];
  for (let row = 0; row < spectrogramRows; row += 1) {
    const index = Math.floor((row / spectrogramRows) * spectrum.length);
    column.push(spectrum[index] ?? 0);
  }
  chartState.spectrogram.push(column);
  if (chartState.spectrogram.length > spectrogramColumns) {
    chartState.spectrogram.shift();
  }
};

const drawChart = () => {
  if (!chartCanvas) {
    return;
  }
  const { ctx, width, height } = prepareCanvas(chartCanvas);
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

  const points = chartState.data.map((value, index) => {
    const x = (width / (chartState.data.length - 1)) * index;
    const y = height - value * (height - 24) - 8;
    return { x, y };
  });

  ctx.strokeStyle = 'rgba(25, 60, 110, 0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = point.x + 10;
    const y = point.y + 10;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, height - 6);
  ctx.lineTo(points[0].x, height - 6);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, 'rgba(77, 178, 255, 0.35)');
  fill.addColorStop(1, 'rgba(8, 16, 28, 0.05)');
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.strokeStyle = 'rgba(77, 178, 255, 0.95)';
  ctx.lineWidth = 2.4;
  ctx.shadowColor = 'rgba(77, 178, 255, 0.6)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
};

const drawFFT = () => {
  if (!fftCanvas) {
    return;
  }
  const { ctx, width, height } = prepareCanvas(fftCanvas);
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

  const bars = fftBins;
  const barWidth = width / bars;
  ctx.fillStyle = 'rgba(255, 159, 64, 0.9)';
  for (let i = 0; i < bars; i += 1) {
    const amp = Math.max(0.05, chartState.spectrum[i] ?? 0);
    const barHeight = amp * height;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.6, barHeight);
  }
};

const drawPhase = () => {
  if (!phaseCanvas) {
    return;
  }
  const { ctx, width, height } = prepareCanvas(phaseCanvas);
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

  const points = chartState.signal.length;
  const phaseShift = Math.floor(points * 0.12);
  const pathPoints = [];
  for (let i = 0; i < points; i += 1) {
    const xVal = chartState.signal[i] ?? 0;
    const yVal = chartState.signal[(i + phaseShift) % points] ?? 0;
    const x = width / 2 + xVal * (width * 0.35);
    const y = height / 2 + yVal * (height * 0.35);
    pathPoints.push({ x, y });
  }

  ctx.strokeStyle = 'rgba(90, 60, 10, 0.5)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  pathPoints.forEach((point, index) => {
    const x = point.x + 8;
    const y = point.y + 8;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 180, 40, 0.95)';
  ctx.lineWidth = 2.6;
  ctx.shadowColor = 'rgba(255, 180, 40, 0.6)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  pathPoints.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
};

const drawSpectrogram = () => {
  if (!spectrogramCanvas) {
    return;
  }
  const { ctx, width, height } = prepareCanvas(spectrogramCanvas);
  ctx.clearRect(0, 0, width, height);
  const columns = spectrogramColumns;
  const rows = spectrogramRows;
  const colWidth = width / columns;
  const rowHeight = height / rows;
  for (let x = 0; x < columns; x += 1) {
    const column = chartState.spectrogram[x] ?? [];
    for (let y = 0; y < rows; y += 1) {
      const intensity = column[y] ?? 0;
      const hue = 260 - intensity * 200;
      const light = 18 + intensity * 55;
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
  chartState.tick += 1;
  chartState.signal = buildSignal(raw, config);
  chartState.spectrum = computeSpectrum(chartState.signal);
  updateSpectrogram(chartState.spectrum);
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
