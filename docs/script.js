document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const buttons = Array.from(document.querySelectorAll('.carousel-btn'));
  let activeIndex = 0;
  let autoTimer;

  const setActive = (index) => {
    if (!slides.length) return;
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === activeIndex);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIndex);
      dot.setAttribute('aria-current', idx === activeIndex ? 'true' : 'false');
    });
  };

  const restartAutoPlay = () => {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => setActive(activeIndex + 1), 6000);
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const direction = btn.dataset.direction === 'prev' ? -1 : 1;
      setActive(activeIndex + direction);
      restartAutoPlay();
    });
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = Number(dot.dataset.index || 0);
      setActive(target);
      restartAutoPlay();
    });
  });

  setActive(0);
  restartAutoPlay();
});
