const toggleButtons = document.querySelectorAll('.valve-btn, .toggle-btn');

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
};

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => toggleState(button));
});

const sensorConfig = [
  { id: 'sensor-p1', label: 'P1', min: 0, max: 1.5, unit: ' bar' },
  { id: 'sensor-p2', label: 'P2', min: 0, max: 1.5, unit: ' bar' },
  { id: 'sensor-p3', label: 'P3', min: 0, max: 1.2, unit: ' bar' },
  { id: 'sensor-p4', label: 'P4', min: 0, max: 1.2, unit: ' bar' },
  { id: 'sensor-t1', label: 'T1', min: -10, max: 30, unit: '℃', decimals: 1 },
  { id: 'sensor-t2', label: 'T2', min: -10, max: 30, unit: '℃', decimals: 1 },
  { id: 'sensor-t3', label: 'T3', min: -10, max: 30, unit: '℃', decimals: 1 },
  { id: 'sensor-dp1', label: 'DP1', min: 0, max: 5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-dp2', label: 'DP2', min: 0, max: 5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-flow1', label: '', min: 0, max: 0.8, unit: ' g/s', decimals: 2 },
  { id: 'sensor-flow2', label: '', min: 0, max: 0.8, unit: ' g/s', decimals: 2 },
  { id: 'sensor-l1', label: 'L1', min: 0, max: 5, unit: ' N', decimals: 2 },
  { id: 'sensor-p5', label: 'P5', min: 0, max: 1.2, unit: ' bar' },
  { id: 'sensor-p6', label: 'P6', min: 0, max: 1.2, unit: ' bar' },
];

const sensorTargets = sensorConfig
  .map((item) => ({ ...item, node: document.getElementById(item.id) }))
  .filter((item) => item.node);

const randomValue = (min, max) => Math.random() * (max - min) + min;

const formatValue = (value, decimals = 2) => value.toFixed(decimals);

const updateSensors = () => {
  sensorTargets.forEach((sensor) => {
    const decimals = sensor.decimals ?? 2;
    const value = formatValue(randomValue(sensor.min, sensor.max), decimals);
    const prefix = sensor.label ? `${sensor.label} ` : '';
    sensor.node.textContent = `${prefix}${value}${sensor.unit}`;
  });
};

updateSensors();
setInterval(updateSensors, 1200);

const chartConfig = {
  p1: { label: 'P1', unit: 'bar', min: 0, max: 1.5 },
  p2: { label: 'P2', unit: 'bar', min: 0, max: 1.5 },
  p3: { label: 'P3', unit: 'bar', min: 0, max: 1.2 },
  p4: { label: 'P4', unit: 'bar', min: 0, max: 1.2 },
  t1: { label: 'T1', unit: '℃', min: -10, max: 30 },
  t2: { label: 'T2', unit: '℃', min: -10, max: 30 },
  dp1: { label: 'DP1', unit: 'kPa', min: 0, max: 5 },
  dp2: { label: 'DP2', unit: 'kPa', min: 0, max: 5 },
  flow1: { label: 'Flow-1', unit: 'g/s', min: 0, max: 0.8 },
  flow2: { label: 'Flow-2', unit: 'g/s', min: 0, max: 0.8 },
};

const chartButtons = document.querySelectorAll('.chart-btn');
const chartTitle = document.querySelector('.chart-title');
const chartUnit = document.querySelector('.chart-unit');
const chartValue = document.getElementById('chart-latest');
const chartCanvas = document.getElementById('trend-chart');

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
  const raw = randomValue(config.min, config.max);
  const normalized = (raw - config.min) / (config.max - config.min);
  chartState.data.push(Math.min(Math.max(normalized, 0), 1));
  chartState.data.shift();
  if (chartValue) {
    chartValue.textContent = raw.toFixed(2);
  }
  drawChart();
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
  setInterval(pushChartValue, 1200);
}
