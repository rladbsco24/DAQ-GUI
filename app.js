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
