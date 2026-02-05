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
  { id: 'sensor-p1', label: 'P1', min: 0, max: 1.5, unit: '' },
  { id: 'sensor-p2', label: 'P2', min: 0, max: 1.5, unit: '' },
  { id: 'sensor-t1', label: 'T1', min: -10, max: 30, unit: '℃', decimals: 1 },
  { id: 'sensor-t2', label: 'T2', min: -10, max: 30, unit: '℃', decimals: 1 },
  { id: 'sensor-dp1', label: 'DP1', min: 0, max: 5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-dp2', label: 'DP2', min: 0, max: 5, unit: ' kPa', decimals: 2 },
  { id: 'sensor-p5', label: 'P5', min: 0, max: 1.2, unit: '' },
  { id: 'sensor-p6', label: 'P6', min: 0, max: 1.2, unit: '' },
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
    sensor.node.textContent = `${sensor.label} ${value}${sensor.unit}`;
  });
};

updateSensors();
setInterval(updateSensors, 1200);
