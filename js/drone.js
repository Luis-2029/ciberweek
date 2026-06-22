gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

window.addEventListener('load', () => {

  const drone  = document.getElementById('droneEl');
  const svgEl  = document.getElementById('dronePath');
  const path   = document.getElementById('flightPath');

  /* 1. Ajustar el tamaño del SVG al viewport actual */
  function syncViewBox() {
    svgEl.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  }
  syncViewBox();

  /* 2. Redefinir la ruta con las dimensiones actuales del viewport */
  function buildPath() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* Onda en S que cruza todo el viewport.
       Ajusta las fracciones Y para subir o bajar cada punto de control
       si el dron vuela muy alto o muy bajo en tu pantalla. */
    const d = `
      M ${-120},${H * 0.35}
      C ${W * 0.10},${H * 0.05}
        ${W * 0.25},${H * 0.80}
        ${W * 0.40},${H * 0.45}
      S ${W * 0.60},${H * 0.05}
        ${W * 0.65},${H * 0.30}
      S ${W * 0.85},${H * 0.85}
        ${W * 1.00},${H * 0.50}
      S ${W * 1.20},${H * 0.15}
        ${W + 150},${H * 0.40}
    `;
    path.setAttribute('d', d);
  }
  buildPath();

  /* 3. Se coloca el dron al inicio de la ruta (fuera de pantalla) */
  gsap.set(drone, {
    xPercent: -50,   /* para que el centro del dron quede sobre la ruta, no su esquina */
    yPercent: -50,
    opacity: 1,
  });

  /* 4. Animación MotionPath controlada por scroll */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger:    document.documentElement,   /* página completa */
      start:      'top top',
      end:        'bottom bottom',
      scrub:      1.8,          /* segundos de suavizado; aumentar para un efecto más fluido */
    }
  });

  tl.to(drone, {
    ease: 'none',              /* lineal para que la posición corresponda 1 a 1 con el scroll */
    motionPath: {
      path:        '#flightPath',
      align:       '#flightPath',
      alignOrigin: [0.5, 0.5], /* mantener el centro del dron sobre la ruta */
      autoRotate:  20,         /* inclinar hasta 20° en la dirección de movimiento */
    },
  });

  /* 5. Mantener la ruta sincronizada al redimensionar la ventana */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncViewBox();
      buildPath();
      ScrollTrigger.refresh();
    }, 200);
  });

});
