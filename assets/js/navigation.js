/* Forward and backward navigation for mapped USARunway slide sequences. */
(() => {
  const slide = document.querySelector('.slide[data-next], .slide[data-prev]');
  if (!slide) return;

  const nextDestination = slide.dataset.next;
  const previousDestination = slide.dataset.prev;
  let navigating = false;
  let touchStartY = null;
  let wheelBoundaryArmed = false;

  const smallScreen = window.matchMedia('(max-width: 1024px)');

  /* Mobile/tablet page-to-page scrolling is intentionally limited to the
     multi-page sections. The section landing pages remain separate. */
  const mobileSequences = [
    ['p03.html', 'p04.html', 'p05.html'],
    ['p07.html', 'p08.html', 'p09.html', 'p10.html'],
    ['p11.html', 'p12.html', 'p13.html', 'p14.html'],
    ['p15.html', 'p16.html', 'p17.html'],
    ['p18.html', 'p19.html', 'p20.html']
  ];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* Visible edge controls use the nested sequence itself as the sole source
     of truth. This prevents a nested page from linking back to a section
     landing page and guarantees first/middle/final controls are consistent. */
  const edgeSequences = [
    ['p04.html', 'p05.html'],
    ['p07.html', 'p08.html', 'p09.html', 'p10.html'],
    ['p11.html', 'p12.html', 'p13.html', 'p14.html'],
    ['p15.html', 'p16.html', 'p17.html'],
    ['p19.html', 'p20.html']
  ];

  const edgeSequence = edgeSequences.find((pages) => pages.includes(currentPage));
  const edgeIndex = edgeSequence ? edgeSequence.indexOf(currentPage) : -1;
  const edgePrevious = edgeIndex > 0 ? edgeSequence[edgeIndex - 1] : null;
  const edgeNext = edgeSequence && edgeIndex < edgeSequence.length - 1
    ? edgeSequence[edgeIndex + 1]
    : null;

  const addEdgeNavigation = () => {
    if (!edgeSequence || document.querySelector('.edge-page-nav')) return;

    const navigation = document.createElement('nav');
    navigation.className = 'edge-page-nav';
    navigation.setAttribute('aria-label', 'Previous and next nested page');

    if (edgePrevious) {
      const previous = document.createElement('a');
      previous.className = 'edge-page-nav__previous';
      previous.href = edgePrevious;
      previous.setAttribute('aria-label', 'Previous page');
      previous.textContent = '<';
      navigation.appendChild(previous);
    }

    if (edgeNext) {
      const next = document.createElement('a');
      next.className = 'edge-page-nav__next';
      next.href = edgeNext;
      next.setAttribute('aria-label', 'Next page');
      next.textContent = '>';
      navigation.appendChild(next);
    }

    document.body.appendChild(navigation);
  };

  addEdgeNavigation();
  const mobileSequence = mobileSequences.find((pages) => pages.includes(currentPage));
  const mobileIndex = mobileSequence ? mobileSequence.indexOf(currentPage) : -1;
  const mobilePrevious = mobileIndex > 0 ? mobileSequence[mobileIndex - 1] : null;
  const mobileNext = mobileSequence && mobileIndex < mobileSequence.length - 1
    ? mobileSequence[mobileIndex + 1]
    : null;

  const entryPosition = sessionStorage.getItem('usar-mobile-entry');
  if (entryPosition) {
    sessionStorage.removeItem('usar-mobile-entry');
    window.addEventListener('load', () => {
      window.scrollTo({
        top: entryPosition === 'bottom' ? document.documentElement.scrollHeight : 0,
        behavior: 'auto'
      });
    }, { once: true });
  }

  const addMobileNavigation = () => {
    const existingNavigation = slide.querySelector('.mobile-page-nav');
    if (!smallScreen.matches) {
      existingNavigation?.remove();
      return;
    }
    if (existingNavigation) return;
    const navigation = document.createElement('nav');
    navigation.className = 'mobile-page-nav';
    navigation.setAttribute('aria-label', 'Page navigation');

    if (previousDestination) {
      const previous = document.createElement('a');
      previous.href = previousDestination;
      previous.textContent = '← Previous';
      navigation.appendChild(previous);
    }

    if (nextDestination) {
      const next = document.createElement('a');
      next.href = nextDestination;
      next.textContent = 'Next →';
      navigation.appendChild(next);
    }

    slide.appendChild(navigation);
  };

  addMobileNavigation();
  smallScreen.addEventListener('change', addMobileNavigation);

  const navigate = (destination, entryPosition = null) => {
    if (navigating || !destination) return;
    navigating = true;
    if (entryPosition) sessionStorage.setItem('usar-mobile-entry', entryPosition);
    window.location.href = destination;
  };

  const atTop = () => window.scrollY <= 2;
  const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

  window.addEventListener('wheel', (event) => {
    if (smallScreen.matches) {
      const forward = event.deltaY > 12 && atBottom() && mobileNext;
      const backward = event.deltaY < -12 && atTop() && mobilePrevious;
      if (!forward && !backward) {
        wheelBoundaryArmed = false;
        return;
      }
      if (!wheelBoundaryArmed) {
        wheelBoundaryArmed = true;
        window.setTimeout(() => { wheelBoundaryArmed = false; }, 650);
        return;
      }
      event.preventDefault();
      navigate(forward ? mobileNext : mobilePrevious, forward ? 'top' : 'bottom');
      return;
    }
    if (event.deltaY > 12) {
      event.preventDefault();
      navigate(nextDestination);
    } else if (event.deltaY < -12) {
      event.preventDefault();
      navigate(previousDestination);
    }
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault();
      navigate(nextDestination);
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      navigate(previousDestination);
    }
  });

  window.addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (event) => {
    if (touchStartY === null) return;
    const distance = touchStartY - event.changedTouches[0].clientY;
    touchStartY = null;
    if (smallScreen.matches) {
      if (distance > 55 && atBottom()) navigate(mobileNext, 'top');
      if (distance < -55 && atTop()) navigate(mobilePrevious, 'bottom');
      return;
    }
    if (distance > 45) navigate(nextDestination);
    if (distance < -45) navigate(previousDestination);
  }, { passive: true });
})();
