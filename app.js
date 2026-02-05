const toggleButtons = document.querySelectorAll('.valve-btn, .toggle-btn');

const updateValveLabel = (button, state) => {
  const valveId = button.dataset.valve;
  if (!valveId) {
    return;
  }

  const valveLabel = document.querySelector(`.valve-label[data-valve="${valveId}"]`);
  if (!valveLabel) {
    return;
  }

  valveLabel.textContent = state.toUpperCase();
  valveLabel.classList.toggle('on', state === 'on');
  valveLabel.classList.toggle('off', state === 'off');
};

const setButtonState = (button, state) => {
  button.dataset.state = state;
  button.classList.toggle('on', state === 'on');
  button.classList.toggle('off', state === 'off');

  const label = button.querySelector('span');
  if (label) {
    label.textContent = state.toUpperCase();
  }

  updateValveLabel(button, state);
};

const toggleState = (button) => {
  const isOn = button.dataset.state === 'on';
  setButtonState(button, isOn ? 'off' : 'on');
};

toggleButtons.forEach((button) => {
  const initialState = button.dataset.state || 'off';
  setButtonState(button, initialState);
  button.addEventListener('click', () => toggleState(button));
});
