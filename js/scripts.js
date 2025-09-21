window.addEventListener('DOMContentLoaded', () => {
  const sloganText = "When Every Second Counts, We Count for You";
  const sloganEl = document.getElementById('slogan');
  const button = document.getElementById('enter-symptom');

  // Check if elements exist to prevent errors
  if (!sloganEl || !button) {
    console.error('Slogan or button element not found');
    return;
  }

  let index = 0;
  const speed = 70; // Typing speed in milliseconds

  function type() {
    if (index < sloganText.length) {
      sloganEl.textContent += sloganText.charAt(index);
      index++;
      setTimeout(type, speed);
    } else {
      // Ensure button reveal aligns with CSS transition
      button.classList.add('visible');
    }
  }

  // Wait for logo and logo-text animations to complete (2s total: 1s logo + 1s logo-text)
  setTimeout(() => {
    // Trigger slogan animation to match CSS transition
    sloganEl.style.transition = 'opacity 0.5s ease-in, transform 0.5s ease-in';
    sloganEl.style.opacity = '1';
    sloganEl.style.transform = 'translateY(0)';
    type();
  }, 2000); // Adjusted to sync with CSS animations (logo: 1s, logo-text: 1s)
});