const { useEffect, useMemo, useRef, useState } = React;

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

const randomValue = (min, max) => Math.random() * (max - min) + min;
const formatValue = (value, decimals = 2) => value.toFixed(decimals);

const fftBins = 48;
const signalLength = 96;
const spectrogramColumns = 80;
const spectrogramRows = 40;

const buildSignal = (value, config, tick) => {
  const normalized = (value - config.min) / (config.max - config.min);
  const base = 1.2 + normalized * 3.2;
  const amplitude = 0.4 + normalized * 0.45;
  const phase = tick * 0.2;
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

const updateSpectrogram = (spectrogram, spectrum) => {
  const column = [];
  for (let row = 0; row < spectrogramRows; row += 1) {
    const index = Math.floor((row / spectrogramRows) * spectrum.length);
    column.push(spectrum[index] ?? 0);
  }
  const next = [...spectrogram, column];
  if (next.length > spectrogramColumns) {
    next.shift();
  }
  return next;
};

const ToggleButton = ({ active, label, onClick }) => (
  <button className={`toggle-btn ${active ? 'on' : 'off'}`} data-state={active ? 'on' : 'off'} onClick={onClick}>
    {label} <span>{active ? 'ON' : 'OFF'}</span>
  </button>
);

const ValveButton = ({ active, label, onClick }) => (
  <button className={`valve-btn ${active ? 'on' : 'off'}`} data-state={active ? 'on' : 'off'} onClick={onClick}>
    {label} <span>{active ? 'ON' : 'OFF'}</span>
  </button>
);

const formatSensorText = (sensorId, value) => {
  const sensor = sensorConfig.find((item) => item.id === sensorId);
  if (!sensor) return '';
  const decimals = sensor.decimals ?? 2;
  const prefix = sensor.label ? `${sensor.label} ` : '';
  return `${prefix}${formatValue(value, decimals)}${sensor.unit}`;
};

const App = () => {
  const initialSensors = useMemo(() => {
    const state = {};
    sensorConfig.forEach((sensor) => {
      state[sensor.id] = randomValue(sensor.min, sensor.max);
    });
    return state;
  }, []);

  const [sensorValues, setSensorValues] = useState(initialSensors);
  const [valves, setValves] = useState({
    gcfv: false,
    gcov: true,
    mfv: false,
    mov: true,
    bv1: false,
    bv2: false,
    bv3: false,
    bv4: false,
  });
  const [toggles, setToggles] = useState({
    autoReconnect: true,
    dropMonitor: true,
    emergencyStop: false,
    interlock: true,
    logging: true,
    batchWrite: true,
    autoLoad: true,
    lock: false,
  });
  const [chartState, setChartState] = useState({
    selected: 'p1',
    data: Array.from({ length: 40 }, () => 0),
    signal: [],
    spectrum: [],
    spectrogram: [],
    tick: 0,
  });

  const trendRef = useRef(null);
  const fftRef = useRef(null);
  const phaseRef = useRef(null);
  const spectrogramRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSensorValues((prev) => {
        const next = { ...prev };
        sensorConfig.forEach((sensor) => {
          const drift = randomValue(-0.05, 0.05);
          const updated = Math.min(sensor.max, Math.max(sensor.min, prev[sensor.id] + drift));
          next[sensor.id] = updated;
        });
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setChartState((prev) => {
        const config = chartConfig[prev.selected];
        if (!config) return prev;
        const raw = sensorValues[config.sensorId] ?? randomValue(config.min, config.max);
        const normalized = (raw - config.min) / (config.max - config.min);
        const data = [...prev.data, Math.min(Math.max(normalized, 0), 1)];
        data.shift();
        const tick = prev.tick + 1;
        const signal = buildSignal(raw, config, tick);
        const spectrum = computeSpectrum(signal);
        const spectrogram = updateSpectrogram(prev.spectrogram, spectrum);
        return { ...prev, data, signal, spectrum, spectrogram, tick, latest: raw };
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [sensorValues]);

  useEffect(() => {
    const canvas = trendRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
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
  }, [chartState]);

  useEffect(() => {
    const canvas = fftRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
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

    const barWidth = width / fftBins;
    ctx.fillStyle = 'rgba(255, 159, 64, 0.9)';
    for (let i = 0; i < fftBins; i += 1) {
      const amp = Math.max(0.05, chartState.spectrum[i] ?? 0);
      const barHeight = amp * height;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.6, barHeight);
    }
  }, [chartState]);

  useEffect(() => {
    const canvas = phaseRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
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
    const points = chartState.signal.length;
    const phaseShift = Math.floor(points * 0.12);
    for (let i = 0; i < points; i += 1) {
      const xVal = chartState.signal[i] ?? 0;
      const yVal = chartState.signal[(i + phaseShift) % points] ?? 0;
      const x = width / 2 + xVal * (width * 0.35);
      const y = height / 2 + yVal * (height * 0.35);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [chartState]);

  useEffect(() => {
    const canvas = spectrogramRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const colWidth = width / spectrogramColumns;
    const rowHeight = height / spectrogramRows;

    for (let x = 0; x < spectrogramColumns; x += 1) {
      const column = chartState.spectrogram[x] ?? [];
      for (let y = 0; y < spectrogramRows; y += 1) {
        const intensity = column[y] ?? 0;
        const hue = 260 - intensity * 200;
        const light = 18 + intensity * 55;
        ctx.fillStyle = `hsl(${hue}, 90%, ${light}%)`;
        ctx.fillRect(x * colWidth, y * rowHeight, colWidth + 1, rowHeight + 1);
      }
    }
  }, [chartState]);

  const chartButtons = Object.entries(chartConfig);
  const selectedChart = chartConfig[chartState.selected];

  return (
    <>
      <header className="app-header">
        <div>
          <h1>로켓 지상시험 DAQ/GUI</h1>
          <p>실시간 상태 표시, 로깅, 캘리브레이션, 구성 관리까지 포함한 통합 운용 시안</p>
        </div>
        <div className="status-strip">
          <span className="status-pill connected">Connected</span>
          <span className="status-pill">Frames: 12000</span>
          <span className="status-pill">Drops: 2 (0.017%)</span>
          <span className="status-pill">CRC Errors: 0</span>
          <span className="status-pill">Queue: 42%</span>
          <span className="status-pill">NTP Sync: OK</span>
        </div>
      </header>

      <main className="layout">
        <section className="panel schematic">
          <div className="panel-header">
            <h2>추진제 공급/배관도</h2>
            <div className="legend">
              <span className="legend-item on">ON</span>
              <span className="legend-item off">OFF</span>
            </div>
          </div>
          <div className="schematic-canvas">
            <svg viewBox="0 0 900 740" aria-label="Propellant schematic">
              <defs>
                <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#eaeaf3" />
                </marker>
              </defs>
              <rect x="20" y="20" width="860" height="700" rx="18" className="frame" />

              <text x="120" y="105" className="label">GC1</text>
              <text x="275" y="105" className="label">GC2</text>
              <text x="610" y="105" className="label">GC3</text>
              <text x="760" y="105" className="label">GC4</text>
              <text x="120" y="125" className="label small">GCH4</text>
              <text x="275" y="125" className="label small">GCH4</text>
              <text x="610" y="125" className="label small">GOx</text>
              <text x="760" y="125" className="label small">GOx</text>

              <rect x="80" y="140" width="120" height="230" rx="50" className="tank tank-left" />
              <rect x="230" y="140" width="120" height="230" rx="50" className="tank tank-left" />
              <rect x="560" y="140" width="120" height="230" rx="50" className="tank tank-right" />
              <rect x="710" y="140" width="120" height="230" rx="50" className="tank tank-right" />
              <text x="120" y="255" className="label tank-label">GC1</text>
              <text x="120" y="280" className="label small tank-label">GCH4</text>
              <text x="270" y="255" className="label tank-label">GC2</text>
              <text x="270" y="280" className="label small tank-label">GCH4</text>
              <text x="600" y="255" className="label tank-label">GC3</text>
              <text x="600" y="280" className="label small tank-label">GOx</text>
              <text x="750" y="255" className="label tank-label">GC4</text>
              <text x="750" y="280" className="label small tank-label">GOx</text>

              <rect x="80" y="70" width="90" height="26" rx="6" className="sensor" />
              <text x="88" y="88" className="sensor-text">{formatSensorText('sensor-p1', sensorValues['sensor-p1'])}</text>
              <rect x="720" y="70" width="90" height="26" rx="6" className="sensor" />
              <text x="728" y="88" className="sensor-text">{formatSensorText('sensor-p2', sensorValues['sensor-p2'])}</text>

              <line x1="140" y1="370" x2="140" y2="470" className="pipe" />
              <line x1="290" y1="370" x2="290" y2="470" className="pipe" />
              <line x1="620" y1="370" x2="620" y2="470" className="pipe" />
              <line x1="770" y1="370" x2="770" y2="470" className="pipe" />

              <line x1="140" y1="470" x2="420" y2="470" className="pipe" />
              <line x1="480" y1="470" x2="770" y2="470" className="pipe" />
              <line x1="450" y1="470" x2="450" y2="610" className="pipe" />

              <line x1="60" y1="430" x2="360" y2="430" className="dashed-line" />
              <line x1="540" y1="430" x2="840" y2="430" className="dashed-line" />

              <line x1="210" y1="100" x2="210" y2="40" className="pipe" markerEnd="url(#arrow-head)" />
              <text x="185" y="32" className="label small">BV1</text>
              <text x="160" y="48" className="label small">GCH4 Vent</text>
              <line x1="690" y1="100" x2="690" y2="40" className="pipe" markerEnd="url(#arrow-head)" />
              <text x="665" y="32" className="label small">BV2</text>
              <text x="650" y="48" className="label small">GOx Vent</text>

              <line x1="140" y1="430" x2="60" y2="430" className="pipe" />
              <line x1="770" y1="430" x2="840" y2="430" className="pipe" />
              <text x="45" y="455" className="label small">BV3</text>
              <text x="30" y="470" className="label small">GCH4 Vent</text>
              <text x="830" y="455" className="label small">BV4</text>
              <text x="810" y="470" className="label small">GOx Vent</text>
              <line x1="88" y1="430" x2="112" y2="430" className="valve-symbol" />
              <line x1="112" y1="420" x2="88" y2="440" className="valve-symbol" />
              <line x1="788" y1="430" x2="812" y2="430" className="valve-symbol" />
              <line x1="812" y1="420" x2="788" y2="440" className="valve-symbol" />

              <rect x="230" y="410" width="70" height="26" rx="6" className="sensor" />
              <text x="238" y="428" className="sensor-text">{formatSensorText('sensor-p3', sensorValues['sensor-p3'])}</text>
              <rect x="600" y="410" width="70" height="26" rx="6" className="sensor" />
              <text x="608" y="428" className="sensor-text">{formatSensorText('sensor-p4', sensorValues['sensor-p4'])}</text>

              <rect x="330" y="540" width="90" height="26" rx="6" className="sensor" />
              <text x="338" y="558" className="sensor-text">{formatSensorText('sensor-dp1', sensorValues['sensor-dp1'])}</text>
              <rect x="470" y="540" width="90" height="26" rx="6" className="sensor" />
              <text x="478" y="558" className="sensor-text">{formatSensorText('sensor-dp2', sensorValues['sensor-dp2'])}</text>
              <rect x="340" y="508" width="80" height="24" rx="6" className="sensor small-box" />
              <text x="348" y="525" className="sensor-text">{formatSensorText('sensor-flow1', sensorValues['sensor-flow1'])}</text>
              <rect x="470" y="508" width="80" height="24" rx="6" className="sensor small-box" />
              <text x="478" y="525" className="sensor-text">{formatSensorText('sensor-flow2', sensorValues['sensor-flow2'])}</text>

              <rect x="140" y="560" width="80" height="26" rx="6" className="sensor" />
              <text x="148" y="578" className="sensor-text">{formatSensorText('sensor-t1', sensorValues['sensor-t1'])}</text>
              <rect x="640" y="560" width="80" height="26" rx="6" className="sensor" />
              <text x="648" y="578" className="sensor-text">{formatSensorText('sensor-t2', sensorValues['sensor-t2'])}</text>

              <rect x="330" y="620" width="90" height="26" rx="6" className="sensor" />
              <text x="338" y="638" className="sensor-text">{formatSensorText('sensor-l1', sensorValues['sensor-l1'])}</text>

              <circle cx="450" cy="650" r="34" className="engine" />
              <text x="430" y="702" className="label small">ENGINE</text>

              <rect x="330" y="675" width="80" height="26" rx="6" className="sensor" />
              <text x="338" y="693" className="sensor-text">{formatSensorText('sensor-p5', sensorValues['sensor-p5'])}</text>
              <rect x="470" y="675" width="80" height="26" rx="6" className="sensor" />
              <text x="478" y="693" className="sensor-text">{formatSensorText('sensor-p6', sensorValues['sensor-p6'])}</text>
              <rect x="510" y="645" width="80" height="26" rx="6" className="sensor" />
              <text x="518" y="663" className="sensor-text">{formatSensorText('sensor-t3', sensorValues['sensor-t3'])}</text>

              <rect x="370" y="395" width="70" height="24" rx="6" className={`valve-tag ${valves.gcfv ? 'on' : 'off'}`} />
              <text x="382" y="411" className="valve-text">GCFV</text>
              <text x="420" y="411" className={`valve-state ${valves.gcfv ? 'on' : 'off'}`}>{valves.gcfv ? 'ON' : 'OFF'}</text>
              <rect x="450" y="395" width="70" height="24" rx="6" className={`valve-tag ${valves.gcov ? 'on' : 'off'}`} />
              <text x="462" y="411" className="valve-text">GCOV</text>
              <text x="500" y="411" className={`valve-state ${valves.gcov ? 'on' : 'off'}`}>{valves.gcov ? 'ON' : 'OFF'}</text>

              <rect x="140" y="595" width="70" height="24" rx="6" className={`valve-tag ${valves.mfv ? 'on' : 'off'}`} />
              <text x="152" y="611" className="valve-text">MFV</text>
              <text x="184" y="611" className={`valve-state ${valves.mfv ? 'on' : 'off'}`}>{valves.mfv ? 'ON' : 'OFF'}</text>
              <rect x="640" y="595" width="70" height="24" rx="6" className={`valve-tag ${valves.mov ? 'on' : 'off'}`} />
              <text x="652" y="611" className="valve-text">MOV</text>
              <text x="684" y="611" className={`valve-state ${valves.mov ? 'on' : 'off'}`}>{valves.mov ? 'ON' : 'OFF'}</text>
            </svg>

            <div className="valve-panel">
              {Object.entries(valves).map(([key, value]) => (
                <ValveButton
                  key={key}
                  label={key.toUpperCase()}
                  active={value}
                  onClick={() =>
                    setValves((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="panel charts">
          <div className="panel-header">
            <h2>실시간 그래프</h2>
            <div className="chart-controls">
              {chartButtons.map(([key, config]) => (
                <button
                  key={key}
                  className={`chart-btn ${chartState.selected === key ? 'active' : ''}`}
                  data-sensor={key}
                  onClick={() =>
                    setChartState((prev) => ({
                      ...prev,
                      selected: key,
                      data: Array.from({ length: 40 }, () => 0),
                    }))
                  }
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-grid">
            <div className="chart-card wide">
              <div className="chart-meta">
                <div>
                  <p className="chart-title">{selectedChart?.label ?? ''}</p>
                  <p className="chart-unit">{selectedChart?.unit ?? ''}</p>
                </div>
                <div className="chart-value" id="chart-latest">
                  {chartState.latest ? chartState.latest.toFixed(2) : '0.00'}
                </div>
              </div>
              <canvas id="trend-chart" width="900" height="240" ref={trendRef}></canvas>
            </div>
            <div className="chart-card">
              <div className="chart-meta">
                <div>
                  <p className="chart-title">FFT</p>
                  <p className="chart-unit">Hz</p>
                </div>
              </div>
              <canvas id="fft-chart" width="420" height="240" ref={fftRef}></canvas>
            </div>
            <div className="chart-card">
              <div className="chart-meta">
                <div>
                  <p className="chart-title">Phase</p>
                  <p className="chart-unit">Lissajous</p>
                </div>
              </div>
              <canvas id="phase-chart" width="420" height="240" ref={phaseRef}></canvas>
            </div>
            <div className="chart-card wide">
              <div className="chart-meta">
                <div>
                  <p className="chart-title">Spectrogram</p>
                  <p className="chart-unit">Intensity</p>
                </div>
              </div>
              <canvas id="spectrogram-chart" width="900" height="240" ref={spectrogramRef}></canvas>
            </div>
          </div>
        </section>

        <section className="panel status">
          <div className="panel-header">
            <h2>운용 상태 & 알람</h2>
          </div>
          <div className="status-grid">
            <div className="status-card">
              <h3>연결/동기화</h3>
              <ul>
                <li>USB 링크 상태: 안정적</li>
                <li>NTP/PTP 동기: 0.8 ms</li>
                <li>재연결 횟수: 0</li>
              </ul>
              <div className="toggle-row">
                <ToggleButton
                  label="Auto Reconnect"
                  active={toggles.autoReconnect}
                  onClick={() => setToggles((prev) => ({ ...prev, autoReconnect: !prev.autoReconnect }))}
                />
                <ToggleButton
                  label="Drop Monitor"
                  active={toggles.dropMonitor}
                  onClick={() => setToggles((prev) => ({ ...prev, dropMonitor: !prev.dropMonitor }))}
                />
              </div>
            </div>
            <div className="status-card">
              <h3>경고 및 인터락</h3>
              <ul className="alarm-list">
                <li className="alarm warning">P1 저압 경고 (임계치 50psi)</li>
                <li className="alarm ok">CRC 정상</li>
                <li className="alarm ok">파일 저장 공간 78% 여유</li>
              </ul>
              <div className="toggle-row">
                <ToggleButton
                  label="Emergency Stop"
                  active={toggles.emergencyStop}
                  onClick={() => setToggles((prev) => ({ ...prev, emergencyStop: !prev.emergencyStop }))}
                />
                <ToggleButton
                  label="Interlock"
                  active={toggles.interlock}
                  onClick={() => setToggles((prev) => ({ ...prev, interlock: !prev.interlock }))}
                />
              </div>
            </div>
            <div className="status-card">
              <h3>큐/처리량</h3>
              <div className="meter">
                <span>큐 사용량</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div className="meter">
                <span>디스크 기록 속도</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div className="meter">
                <span>GUI 업데이트 주기</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel logging">
          <div className="panel-header">
            <h2>세션 로깅 & 메타데이터</h2>
          </div>
          <div className="logging-grid">
            <div className="logging-card">
              <h3>세션 관리</h3>
              <div className="kv">
                <span>세션 ID</span>
                <span>2026-02-05_run07</span>
              </div>
              <div className="kv">
                <span>파일 포맷</span>
                <span>CSV + HDF5</span>
              </div>
              <div className="kv">
                <span>파일 위치</span>
                <span>D:/DAQ/logs/</span>
              </div>
              <div className="toggle-row">
                <ToggleButton
                  label="Logging"
                  active={toggles.logging}
                  onClick={() => setToggles((prev) => ({ ...prev, logging: !prev.logging }))}
                />
                <ToggleButton
                  label="Batch Write"
                  active={toggles.batchWrite}
                  onClick={() => setToggles((prev) => ({ ...prev, batchWrite: !prev.batchWrite }))}
                />
              </div>
            </div>
            <div className="logging-card">
              <h3>시험 메타데이터</h3>
              <div className="form-grid">
                <div>
                  <label>시험명</label>
                  <input type="text" defaultValue="LOX/CH4 cold-flow" />
                </div>
                <div>
                  <label>담당자</label>
                  <input type="text" defaultValue="J. Doe" />
                </div>
                <div>
                  <label>시험장</label>
                  <input type="text" defaultValue="Pad A" />
                </div>
                <div>
                  <label>버전</label>
                  <input type="text" defaultValue="DAQ v2.1" />
                </div>
              </div>
            </div>
            <div className="logging-card">
              <h3>채널 요약</h3>
              <table className="channel-table">
                <thead>
                  <tr>
                    <th>채널</th>
                    <th>단위</th>
                    <th>보정</th>
                    <th>표시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ChamberPressure</td>
                    <td>psi</td>
                    <td>scale 0.0987</td>
                    <td><span className="chip good">ON</span></td>
                  </tr>
                  <tr>
                    <td>FuelTemp</td>
                    <td>℃</td>
                    <td>offset -100</td>
                    <td><span className="chip good">ON</span></td>
                  </tr>
                  <tr>
                    <td>OxFlow</td>
                    <td>kg/s</td>
                    <td>scale 1.02</td>
                    <td><span className="chip warn">LIMIT</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel config">
          <div className="panel-header">
            <h2>설정 & 캘리브레이션</h2>
          </div>
          <div className="config-grid">
            <div className="config-card">
              <h4>구성 프로파일</h4>
              <div className="kv">
                <span>활성 프로파일</span>
                <span>Engine_A</span>
              </div>
              <div className="kv">
                <span>업데이트</span>
                <span>2026-02-05 09:41</span>
              </div>
              <div className="toggle-row">
                <ToggleButton
                  label="Auto Load"
                  active={toggles.autoLoad}
                  onClick={() => setToggles((prev) => ({ ...prev, autoLoad: !prev.autoLoad }))}
                />
                <ToggleButton
                  label="Lock"
                  active={toggles.lock}
                  onClick={() => setToggles((prev) => ({ ...prev, lock: !prev.lock }))}
                />
              </div>
            </div>
            <div className="config-card">
              <h4>채널 레지스트리</h4>
              <div className="kv">
                <span>ChamberPressure</span>
                <span>psi · scale 0.1 · offset 0.0</span>
              </div>
              <div className="kv">
                <span>FuelTemp</span>
                <span>℃ · scale 0.01 · offset -100</span>
              </div>
              <div className="kv">
                <span>OxValve</span>
                <span>state · on/off</span>
              </div>
            </div>
            <div className="config-card">
              <h4>캘리브레이션</h4>
              <div className="kv">
                <span>Long-term</span>
                <span>scale 0.0987 / offset 0.0</span>
              </div>
              <div className="kv">
                <span>Short-term</span>
                <span>zero offset +0.5 psi</span>
              </div>
              <div className="kv">
                <span>버전</span>
                <span>V2.3</span>
              </div>
              <div className="toggle-row">
                <button className="primary-btn">Zero Calibrate</button>
                <button className="ghost-btn">Span Calibrate</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
