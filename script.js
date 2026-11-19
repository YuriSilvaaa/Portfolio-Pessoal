// barra de progresso de leitura
const progress = document.getElementById('progress');
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// revelar elementos ao rolar
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// destacar no índice a seção que está na tela
const links = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('main section');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      links.forEach((l) => l.classList.toggle('active', l.dataset.target === entry.target.id));
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((s) => sectionObserver.observe(s));

// brilho que acompanha o mouse (só em telas com mouse)
const glow = document.getElementById('glow');
if (glow && window.matchMedia('(hover: hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('pointermove', (e) => {
    glow.style.setProperty('--gx', e.clientX + 'px');
    glow.style.setProperty('--gy', e.clientY + 'px');
  }, { passive: true });
}

// certificados abrem na própria página
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
let lastTrigger = null;

function closeLightbox() {
  lightbox.hidden = true;
  lbImg.removeAttribute('src');
  if (lastTrigger) lastTrigger.focus();
}
document.querySelectorAll('[data-cert]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    lastTrigger = link;
    lbImg.src = link.dataset.cert;
    lightbox.hidden = false;
    lbClose.focus();
  });
});
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

// copiar e-mail
const copyBtn = document.getElementById('copyMail');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const mail = document.getElementById('mailText').textContent;
    try {
      await navigator.clipboard.writeText(mail);
      copyBtn.textContent = 'Copiado';
      copyBtn.classList.add('done');
      setTimeout(() => { copyBtn.textContent = 'Copiar'; copyBtn.classList.remove('done'); }, 1800);
    } catch (err) {
      copyBtn.textContent = 'Selecione o e-mail';
    }
  });
}

// no celular, mantém o link ativo do índice visível
const tocNav = document.querySelector('.toc nav');
links.forEach((l) => {
  new MutationObserver(() => {
    if (l.classList.contains('active') && tocNav && tocNav.scrollWidth > tocNav.clientWidth) {
      tocNav.scrollTo({ left: l.offsetLeft - 16, behavior: 'smooth' });
    }
  }).observe(l, { attributes: true, attributeFilter: ['class'] });
});

// formulário: envia a mensagem para o Gmail (via FormSubmit)
const form = document.getElementById('contactForm');
if (form) {
  const status = document.getElementById('cfStatus');
  const submitBtn = document.getElementById('cfSubmit');
  const ENDPOINT = 'https://formsubmit.co/ajax/yurisilvakta84@gmail.com';

  const setStatus = (msg, kind) => { status.textContent = msg; status.className = 'form-status ' + (kind || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get('_honey')) return; // robô

    const fields = ['cfName', 'cfEmail', 'cfMessage'].map((id) => document.getElementById(id));
    let firstInvalid = null;
    fields.forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad));
      if (bad && !firstInvalid) firstInvalid = f;
    });
    if (firstInvalid) {
      setStatus('Preencha nome, um e-mail válido e a mensagem.', 'err');
      firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    setStatus('Enviando…');
    try {
      const body = new FormData();
      body.append('name', data.get('name'));
      body.append('email', data.get('email'));
      body.append('message', data.get('message'));
      body.append('_subject', 'Nova mensagem pelo portfólio');
      body.append('_template', 'table');
      body.append('_replyto', data.get('email'));

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === 'false') throw new Error('falha');
      form.reset();
      setStatus('Mensagem enviada. Respondo assim que puder.', 'ok');
    } catch (err) {
      setStatus('Não consegui enviar agora. Tente de novo ou escreva para yurisilvakta84@gmail.com.', 'err');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
