window.addEventListener('DOMContentLoaded', () => {
  const sloganText = "Her Questions. Our Answers. Her Power.";
  const sloganEl = document.getElementById('slogan');
  const button = document.getElementById('enter-symptom');

  let index = 0;
  const speed = 70;

  function type() {
    if (index < sloganText.length) {
      sloganEl.textContent += sloganText.charAt(index);
      index++;
      setTimeout(type, speed);
    } else {
      button.classList.add('visible');
    }
  }

  setTimeout(() => {
    sloganEl.style.opacity = 1;
    sloganEl.style.transform = "translateY(0)";
    type();
  }, 2200);
});