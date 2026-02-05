<<<<<<< codex/create-gui-for-report-and-photo-display-j28i8c
const toggleButtons = document.querySelectorAll('.valve-btn, .toggle-btn');

const toggleState = (button) => {
=======
const valveButtons = document.querySelectorAll('.valve-btn');

const toggleValve = (button) => {
>>>>>>> main
  const isOn = button.dataset.state === 'on';
  const nextState = isOn ? 'off' : 'on';
  button.dataset.state = nextState;
  button.classList.toggle('on', nextState === 'on');
  button.classList.toggle('off', nextState === 'off');
  const label = button.querySelector('span');
<<<<<<< codex/create-gui-for-report-and-photo-display-j28i8c
  if (label) {
    label.textContent = nextState.toUpperCase();
  }
};

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => toggleState(button));
=======
  label.textContent = nextState.toUpperCase();
};

valveButtons.forEach((button) => {
  button.addEventListener('click', () => toggleValve(button));
>>>>>>> main
});
