const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyE5-Gu_9jSg-jogVum_j_frxpccZLHpNXhO1NT8Dox4M3NEvmQ3qMXAllBonHaMeYGhQ/exec';
const TOKEN = 'CiberweekAnahuac2026';

/* Inserción del botón "Registrarme" en cada tarjeta de sesión */
document.querySelectorAll('.session-card').forEach(card => {
  const title   = card.querySelector('.sc-badge')?.textContent.trim() ?? '';
  const panel   = card.closest('.day-panel');
  const dayBtn  = document.querySelector(`.day-btn[data-day="${panel?.id?.replace('panel-', '')}"]`);
  const dayName = dayBtn?.querySelector('.day-name')?.textContent.trim() ?? '';

  let actions = card.querySelector('.sc-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'sc-actions';
    card.querySelector('.sc-front').appendChild(actions);
  }

  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 'btn-register';
  btn.dataset.dia    = dayName;
  btn.dataset.sesion = title;
  btn.innerHTML = '&#9998; Registrarme';

  actions.appendChild(btn);

  const SOLO_ONLINE = [
    'Avances y logros T.I',
    'Desarrollo y Estandarización de Prompts',
    'Humanos + agentes',
    'Taller Geneally',
    'IA Agentic en Educación',
  ];
  btn.addEventListener('click', () => openModal(dayName, title, SOLO_ONLINE.includes(title)));
});

/* Elementos del modal */
const modal       = document.getElementById('regModal');
const closeBtn    = document.getElementById('regClose');
const form        = document.getElementById('regForm');
const labelEl     = document.getElementById('regSessionLabel');
const diaInput    = document.getElementById('regDia');
const sesionInput = document.getElementById('regSesion');
const correoInput = document.getElementById('regCorreo');
const areaInput   = document.getElementById('regArea');
const submitBtn   = document.getElementById('regSubmit');
const btnText     = submitBtn.querySelector('.reg-btn-text');
const btnLoading  = submitBtn.querySelector('.reg-btn-loading');
const msgEl       = document.getElementById('regMsg');

function getModalidad() {
  const checked = form.querySelector('input[name="modalidad"]:checked');
  return checked ? checked.value : '';
}

/* Abrir / cerrar */
function openModal(dia, sesion, soloOnline = false) {
  diaInput.value    = dia;
  sesionInput.value = sesion;
  labelEl.textContent = `${dia} · ${sesion}`;
  correoInput.value = '';
  areaInput.value   = '';

  const presencialLabel = form.querySelector('input[name="modalidad"][value="Presencial"]')?.closest('label.reg-radio');
  const onlineRadio     = form.querySelector('input[name="modalidad"][value="Online"]');

  form.querySelectorAll('input[name="modalidad"]').forEach(r => r.checked = false);

  if (soloOnline) {
    if (presencialLabel) presencialLabel.style.display = 'none';
    if (onlineRadio) onlineRadio.checked = true;
  } else {
    if (presencialLabel) presencialLabel.style.display = '';
  }

  hideMsg();
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  correoInput.focus();
}

function closeModal() {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* Validación */
function validate() {
  let ok = true;

  correoInput.classList.remove('error');
  areaInput.classList.remove('error');

  const emailRe = /^[^\s@]+@anahuac\.mx$/i;
  if (!emailRe.test(correoInput.value.trim())) {
    correoInput.classList.add('error');
    showMsg('Solo se aceptan correos con dominio @anahuac.mx', 'error');
    ok = false;
  }

  if (!getModalidad()) {
    showMsg('Selecciona una modalidad (Presencial u Online).', 'error');
    ok = false;
  }

  if (!areaInput.value) {
    areaInput.classList.add('error');
    showMsg('Selecciona tu área.', 'error');
    ok = false;
  }

  return ok;
}

/* Funciones auxiliares de mensajes */
function showMsg(text, type) {
  msgEl.textContent = type === 'success'
    ? '✓ ' + text
    : '✗ ' + text;
  msgEl.className = `reg-msg ${type === 'success' ? 'success' : 'error-msg'}`;
  msgEl.removeAttribute('hidden');
}

function hideMsg() {
  msgEl.setAttribute('hidden', '');
  msgEl.className = 'reg-msg';
}

/* Control de registro duplicado */
function registrationKey(correo, sesion) {
  return `reg::${correo.toLowerCase().trim()}::${sesion}`;
}

function localAlreadyRegistered(correo, sesion) {
  return localStorage.getItem(registrationKey(correo, sesion)) === '1';
}

function markRegistered(correo, sesion) {
  localStorage.setItem(registrationKey(correo, sesion), '1');
}

async function serverAlreadyRegistered(correo, sesion) {
  try {
    const url = `${WEBHOOK_URL}?correo=${encodeURIComponent(correo)}&sesion=${encodeURIComponent(sesion)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.registrado === true;
  } catch {
    return false;
  }
}

/* Envío del formulario */
form.addEventListener('submit', async e => {
  e.preventDefault();
  hideMsg();

  if (!validate()) return;

  const correo    = correoInput.value.trim();
  const sesion    = sesionInput.value;
  const modalidad = getModalidad();
  const area      = areaInput.value;

  if (localAlreadyRegistered(correo, sesion)) {
    correoInput.classList.add('error');
    showMsg('Este correo ya fue registrado para esta sesión.', 'error');
    return;
  }

  submitBtn.disabled = true;
  btnText.hidden     = true;
  btnLoading.hidden  = false;

  const duplicado = await serverAlreadyRegistered(correo, sesion);
  if (duplicado) {
    correoInput.classList.add('error');
    showMsg('Este correo ya fue registrado para esta sesión.', 'error');
    submitBtn.disabled = false;
    btnText.hidden     = false;
    btnLoading.hidden  = true;
    return;
  }

  const payload = {
    token:     TOKEN,
    correo,
    modalidad,
    area,
    dia:       diaInput.value,
    sesion,
    fecha:     new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(payload),
    });
  } catch {
    /* solo falla si no hay internet */
  } finally {
    submitBtn.disabled = false;
    btnText.hidden     = false;
    btnLoading.hidden  = true;
  }

  markRegistered(correo, sesion);
  showMsg('¡Registro exitoso! Te esperamos en la sesión.', 'success');
  form.reset();
  setTimeout(closeModal, 2800);
});
