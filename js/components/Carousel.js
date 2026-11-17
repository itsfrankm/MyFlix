import { createCard } from "./Card.js";

export function createCarousel(category, signal) {
  const section = document.createElement("div");
  section.className = "slider-section";

  // Header for Title and Indicators
  const header = document.createElement("div");
  header.className = "slider-header";

  const title = document.createElement("h2");
  title.className = "slider-title";
  title.innerText = category.title;

  const indicators = document.createElement("div");
  indicators.className = "slider-indicators";

  header.appendChild(title);
  header.appendChild(indicators);
  section.appendChild(header);

  const row = document.createElement("div");
  row.className = "movie-row";

  // create the original set of cards
  category.items.forEach((item) => {
    row.appendChild(createCard(item, signal));
  });

  // For infinite scroll: prepend one copy and append one copy of the whole set
  const items = category.items || [];
  // prepend (in reverse so order is correct)
  for (let i = items.length - 1; i >= 0; i--) {
    row.insertBefore(createCard(items[i], signal), row.firstChild);
  }
  // append
  items.forEach((item) => row.appendChild(createCard(item, signal)));

  section.appendChild(row);

  // Infinite scroll setup: position the scroll to the middle set and
  // keep scrolling seamlessly within the middle window via RAF interpolation.
  let singleSetWidth = 0;
  let currentScrollLeft = 0;
  let targetScrollLeft = 0;
  let rafId = null;

  const calcWidths = () => {
    if (items.length > 0 && row.children.length > items.length) {
      singleSetWidth =
        row.children[items.length].offsetLeft - row.children[0].offsetLeft;
    } else {
      singleSetWidth = row.scrollWidth / 3 || 0;
    }
  };

  const wrapPosition = () => {
    if (!singleSetWidth) return;
    while (currentScrollLeft < singleSetWidth * 0.5) {
      currentScrollLeft += singleSetWidth;
      targetScrollLeft += singleSetWidth;
    }
    while (currentScrollLeft >= singleSetWidth * 1.5) {
      currentScrollLeft -= singleSetWidth;
      targetScrollLeft -= singleSetWidth;
    }
  };

  const animateScroll = () => {
    const diff = targetScrollLeft - currentScrollLeft;
    if (Math.abs(diff) < 0.5) {
      currentScrollLeft = targetScrollLeft;
      wrapPosition();
      row.scrollLeft = currentScrollLeft;
      rafId = null;
      return;
    }

    currentScrollLeft += diff * 0.22;
    wrapPosition();
    row.scrollLeft = currentScrollLeft;
    rafId = requestAnimationFrame(animateScroll);
  };

  // initialize after layout
  requestAnimationFrame(() => {
    calcWidths();
    if (singleSetWidth) {
      currentScrollLeft = singleSetWidth;
      targetScrollLeft = singleSetWidth;
      row.scrollLeft = singleSetWidth;
    }
  });

  // Keep touch / scrollbar drags inside the infinite loop without interfering with wheel RAF
  row.addEventListener("scroll", () => {
    if (rafId !== null) return;
    if (!singleSetWidth) calcWidths();
    if (!singleSetWidth) return;
    if (Math.abs(row.scrollLeft - currentScrollLeft) <= 2) return;

    currentScrollLeft = row.scrollLeft;
    targetScrollLeft = row.scrollLeft;
    wrapPosition();
    if (Math.abs(row.scrollLeft - currentScrollLeft) > 1) {
      row.scrollLeft = currentScrollLeft;
    }
  });

  // Capture mouse wheel while pointer is over the carousel so the page never scrolls
  row.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!singleSetWidth) {
        calcWidths();
        if (singleSetWidth) {
          currentScrollLeft = row.scrollLeft || singleSetWidth;
          targetScrollLeft = currentScrollLeft;
        }
      }

      const rawDelta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const multiplier =
        e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? row.clientWidth : 1;
      targetScrollLeft += rawDelta * multiplier;

      if (!rafId) {
        rafId = requestAnimationFrame(animateScroll);
      }
    },
    { passive: false },
  );

  // recalc measurements on resize and keep position centered
  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      const prevSetWidth = singleSetWidth;
      calcWidths();
      if (singleSetWidth) {
        const offset = prevSetWidth ? currentScrollLeft % prevSetWidth : 0;
        currentScrollLeft = singleSetWidth + offset;
        targetScrollLeft = currentScrollLeft;
        wrapPosition();
        row.scrollLeft = currentScrollLeft;
      }
    });
  }, signal ? { signal } : undefined);

  if (signal) {
    signal.addEventListener("abort", () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }, { once: true });
  }

  return section;
}
