/**
 * Da'Vinci Burger — Swiper hero carousel
 * Exposed as window.DaVinciSwiper for app.js coordination.
 */
(function () {
  "use strict";

  let heroSwiper = null;

  function initHeroSwiper() {
    const el = document.getElementById("hero-swiper");
    if (!el || typeof Swiper === "undefined") return null;

    if (heroSwiper) {
      heroSwiper.destroy(true, true);
      heroSwiper = null;
    }

    heroSwiper = new Swiper("#hero-swiper", {
      slidesPerView: 1.15,
      spaceBetween: 16,
      centeredSlides: true,
      loop: true,
      grabCursor: true,
      autoplay: {
        delay: 4200,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: {
          slidesPerView: 1.4,
          spaceBetween: 20,
        },
        900: {
          slidesPerView: 2.1,
          spaceBetween: 24,
        },
      },
    });

    return heroSwiper;
  }

  window.DaVinciSwiper = {
    init: initHeroSwiper,
    getInstance: function () {
      return heroSwiper;
    },
  };
})();
