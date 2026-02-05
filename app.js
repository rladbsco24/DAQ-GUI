const valveButtons = document.querySelectorAll('.valve-btn');

const toggleValve = (button) => {
  const isOn = button.dataset.state === 'on';
  const nextState = isOn ? 'off' : 'on';
  button.dataset.state = nextState;
  button.classList.toggle('on', nextState === 'on');
  button.classList.toggle('off', nextState === 'off');
  const label = button.querySelector('span');
  label.textContent = nextState.toUpperCase();
};

valveButtons.forEach((button) => {
  button.addEventListener('click', () => toggleValve(button));
});
