/* Cargador de pantalla */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hidden'), 1900);
});

/* Efecto de scroll en la barra de navegación */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* Menú hamburguesa */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');

hamburger.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// Cerrar al hacer clic en un enlace del menú móvil
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMobile.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* Cambio de pestañas por día */
const dayButtons = document.querySelectorAll('.day-btn');
const dayPanels  = document.querySelectorAll('.day-panel');

dayButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetDay = btn.dataset.day;

    // Actualizar botones
    dayButtons.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });

    // Actualizar paneles
    dayPanels.forEach(panel => {
      const isTarget = panel.id === `panel-${targetDay}`;
      panel.classList.toggle('active', isTarget);

      // Usar el atributo hidden para accesibilidad
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // Desplazar a la sección si está fuera de vista
    const scheduleSection = document.getElementById('schedule');
    const rect = scheduleSection.getBoundingClientRect();
    if (rect.top < -80) {
      scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Acordeón de detalles de sesión */
document.querySelectorAll('.btn-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card    = btn.closest('.session-card');
    const details = card.querySelector('.sc-details');
    const isOpen  = !details.hidden;

    // Cerrar todos los demás detalles abiertos en el mismo panel
    const panel = btn.closest('.day-panel');
    panel.querySelectorAll('.sc-details').forEach(d => {
      d.hidden = true;
    });
    panel.querySelectorAll('.btn-toggle').forEach(b => {
      b.classList.remove('open');
      b.setAttribute('aria-expanded', 'false');
    });

    // Cerrar cualquier grabación abierta al mostrar detalles
    closeAllVideos(panel);

    // Alternar el elemento clicado
    if (!isOpen) {
      details.hidden = false;
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');

      // Desplazamiento suave de la tarjeta a la vista
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  });
});

/* Grabaciones de sesión — se muestran resaltadas en la misma tarjeta */
function closeAllVideos(scope) {
  scope.querySelectorAll('.sc-video').forEach(v => {
    v.hidden = true;
    v.innerHTML = '';
  });
  scope.querySelectorAll('.session-card').forEach(c => c.classList.remove('video-open'));
  scope.querySelectorAll('.btn-video').forEach(b => {
    b.classList.remove('open');
    b.setAttribute('aria-expanded', 'false');
  });
}

function sharePointEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (/\.sharepoint\.com$/i.test(u.hostname) && /\/_layouts\/15\/stream\.aspx$/i.test(u.pathname)) {
      const id = u.searchParams.get('id');
      const embed = new URL(url);
      embed.pathname = u.pathname.replace(/stream\.aspx$/i, 'embed.aspx');
      embed.search = '';
      if (id) embed.searchParams.set('id', id);
      return embed.toString();
    }
  } catch (e) { /* not a valid URL */ }
  return null;
}

function buildVideoEmbed(url) {
  if (!url) {
    const p = document.createElement('p');
    p.className = 'video-unavailable';
    p.textContent = 'La grabación de esta sesión estará disponible próximamente.';
    return p;
  }

  const wrap = document.createElement('div');
  wrap.className = 'video-embed';

  let youtubeId = null;
  const ytWatch = url.match(/[?&]v=([^&]+)/);
  const ytShort = url.match(/youtu\.be\/([^?&]+)/);
  const ytEmbedded = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (ytWatch) youtubeId = ytWatch[1];
  else if (ytShort) youtubeId = ytShort[1];
  else if (ytEmbedded) youtubeId = ytEmbedded[1];

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  const spEmbed = sharePointEmbedUrl(url);

  if (spEmbed) {
    wrap.innerHTML = `<iframe src="${spEmbed}" title="Grabación de la sesión" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  } else if (youtubeId) {
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="Grabación de la sesión" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (vimeoMatch) {
    wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" title="Grabación de la sesión" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  } else if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    wrap.innerHTML = `<video controls autoplay src="${url}"></video>`;
  } else {
    wrap.innerHTML = `<iframe src="${url}" title="Grabación de la sesión" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  return wrap;
}

document.querySelectorAll('.btn-video').forEach(btn => {
  btn.addEventListener('click', () => {
    const card  = btn.closest('.session-card');
    const video = card.querySelector('.sc-video');
    const panel = btn.closest('.day-panel');
    const isOpen = !video.hidden;

    // Cerrar detalles abiertos y otras grabaciones del mismo panel
    panel.querySelectorAll('.sc-details').forEach(d => { d.hidden = true; });
    panel.querySelectorAll('.btn-toggle').forEach(b => {
      b.classList.remove('open');
      b.setAttribute('aria-expanded', 'false');
    });
    closeAllVideos(panel);

    if (!isOpen) {
      video.innerHTML = '';
      video.appendChild(buildVideoEmbed(btn.dataset.video.trim()));
      video.hidden = false;
      card.classList.add('video-open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');

      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  });
});

/* Intersection Observer — animar al hacer scroll */
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px',
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observar tarjetas de estadísticas
document.querySelectorAll('.stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity .55s ease, transform .55s ease';
  observer.observe(el);
});

/* Tooltip flotante de ponentes */
(function () {
  const spTooltip = document.getElementById('speakerTooltip');
  const sptAvatar = document.getElementById('sptAvatar');
  const sptName   = document.getElementById('sptName');
  const sptRole   = document.getElementById('sptRole');
  const sptBio    = document.getElementById('sptBio');
  const sptTag    = document.getElementById('sptTag');
  let hideTimer;

  function positionTooltip(e) {
    const gap = 18;
    const w = spTooltip.offsetWidth  || 360;
    const h = spTooltip.offsetHeight || 240;
    let y = e.clientY - h - gap;
    if (y < 8) y = 8;
    let x = e.clientX - w / 2;
    if (x < 8) x = 8;
    if (x + w > window.innerWidth - 8) x = window.innerWidth - w - 8;
    spTooltip.style.left = x + 'px';
    spTooltip.style.top  = y + 'px';
  }

  document.querySelectorAll('.speaker-card[data-bio]').forEach(card => {
    card.style.cursor = 'pointer';

    card.addEventListener('mouseenter', e => {
      clearTimeout(hideTimer);
      const avatarEl = card.querySelector('.sp-avatar');
      const color    = getComputedStyle(avatarEl).getPropertyValue('--c').trim() || '#1e3a5f';
      const imgEl    = avatarEl.querySelector('.sp-avatar-img');
      sptAvatar.style.background = color;
      if (imgEl) {
        sptAvatar.innerHTML = `<img src="${imgEl.src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`;
      } else {
        sptAvatar.textContent = avatarEl.textContent.trim();
      }
      sptName.textContent = card.dataset.name;
      sptRole.textContent = card.dataset.role;
      sptBio.textContent  = card.dataset.bio;
      sptTag.textContent  = card.dataset.tag;
      positionTooltip(e);
      spTooltip.classList.add('visible');
      spTooltip.setAttribute('aria-hidden', 'false');
    });

    card.addEventListener('mousemove', e => {
      if (!spTooltip.matches(':hover')) positionTooltip(e);
    });

    card.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        spTooltip.classList.remove('visible');
        spTooltip.setAttribute('aria-hidden', 'true');
      }, 200);
    });
  });

  spTooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  spTooltip.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      spTooltip.classList.remove('visible');
      spTooltip.setAttribute('aria-hidden', 'true');
    }, 200);
  });
}());
