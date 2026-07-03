/**
 * SNIPPET PRA INJETAR NA LP
 * Captura lead via popup, envia pro CRM via sendBeacon, dispara CAPI parallel.
 *
 * Como usar:
 * 1. Substitua as constantes CHECKOUT_*, CRM_WEBHOOK e CAPI_ENDPOINT
 * 2. Cole no fim do <body> da LP, ou injete via patch script
 * 3. O script intercepta cliques nos CTAs com classes especificas
 * 4. Abre popup, captura nome+whatsapp, envia pro CRM, dispara CAPI, redireciona
 *
 * IMPORTANTE: usa text/plain pra evitar CORS preflight (sendBeacon).
 */
(function() {
  // ===== CONFIGURACAO (ALTERAR AQUI) =====
  var CHECKOUT_PREMIUM = 'https://chk.eduzz.com/SEU_PRODUTO_PREMIUM';
  var CHECKOUT_BASICO = 'https://chk.eduzz.com/SEU_PRODUTO_BASICO';
  var CRM_WEBHOOK = 'https://SEU-CRM.vercel.app/api/webhooks/leads?key=whk_SUA_KEY';
  var CAPI_ENDPOINT = 'https://SEU-CRM.vercel.app/api/meta/capi';
  var META_PIXEL_ID = 'SEU_PIXEL_ID_AQUI';
  var SOURCE_NAME = 'LP Codigo Zero';

  // Classes dos CTAs (ajuste pra sua LP)
  var CTA_PREMIUM_SELECTOR = '.btn-gold-pulse, .navbar-cta';
  var CTA_BASICO_SELECTOR = '.btn-entry, .btn-premium';

  // ===== ESTADO =====
  var pendingCheckoutUrl = null;
  var pendingPlano = null;
  var pendingValor = 0;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ===== HELPERS =====
  function normalizePhone(phone) {
    var d = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
    if (!d) return '';
    if (!/^55/.test(d)) d = '55' + d;
    d = d.replace(/^550/, '55');
    return d;
  }

  function generateEventId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  function sendToCRM(payload) {
    try {
      var jsonBody = JSON.stringify(payload);
      // text/plain pra evitar CORS preflight
      var blob = new Blob([jsonBody], { type: 'text/plain' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CRM_WEBHOOK, blob);
      } else {
        fetch(CRM_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: jsonBody,
          keepalive: true,
          mode: 'no-cors',
        });
      }
    } catch (err) { console.warn('CRM post falhou:', err); }
  }

  function sendCAPI(eventName, eventId, userData, customData) {
    try {
      var payload = {
        eventName: eventName,
        eventId: eventId,
        eventSourceUrl: window.location.href,
        userData: userData || {},
        customData: customData || {},
      };
      var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CAPI_ENDPOINT, blob);
      }
    } catch (err) { console.warn('CAPI failed:', err); }
  }

  // ===== POPUP HANDLING =====
  ready(function() {
    var popup = document.getElementById('exitPopup');
    var form = document.getElementById('exitForm');
    var titleEl = popup && popup.querySelector('h3');
    var subEl = popup && popup.querySelector('p');

    // Intercepta CTAs
    var allCtas = document.querySelectorAll(CTA_PREMIUM_SELECTOR + ', ' + CTA_BASICO_SELECTOR);
    allCtas.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var isPremium = btn.matches(CTA_PREMIUM_SELECTOR);
        pendingCheckoutUrl = isPremium ? CHECKOUT_PREMIUM : CHECKOUT_BASICO;
        pendingPlano = isPremium ? 'Premium' : 'Basico';
        pendingValor = isPremium ? 414 : 127;

        if (titleEl && subEl) {
          if (isPremium) {
            titleEl.textContent = 'Falta 1 passo pro ACESSO PREMIUM';
            subEl.textContent = 'Preencha seus dados e voce sera redirecionado ao checkout Premium.';
          } else {
            titleEl.textContent = 'Falta 1 passo pra garantir sua vaga';
            subEl.textContent = 'Preencha seus dados e voce sera redirecionado ao checkout.';
          }
        }

        // Pixel browser: InitiateCheckout
        var eventId = generateEventId('initcheck');
        if (typeof fbq !== 'undefined') {
          fbq('track', 'InitiateCheckout', {
            value: pendingValor,
            currency: 'BRL',
            content_name: SOURCE_NAME + ' - ' + pendingPlano,
          }, { eventID: eventId });
        }
        // CAPI server-side parallel (mesma eventId pra dedup)
        sendCAPI('InitiateCheckout', eventId, {}, {
          currency: 'BRL',
          value: pendingValor,
          contentName: SOURCE_NAME + ' - ' + pendingPlano,
        });

        if (popup) popup.classList.add('active');
      }, true);
    });

    // Submit do popup
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var nameEl = form.querySelector('input[type="text"]') || form.querySelector('input');
        var phoneEl = form.querySelector('input[type="tel"]');
        var name = nameEl && nameEl.value.trim();
        var phone = phoneEl && phoneEl.value.trim();
        if (!name || !phone) return false;

        var waNormalized = normalizePhone(phone);
        var leadEventId = generateEventId('lead');

        // Pixel browser: Lead
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Lead', {
            content_name: SOURCE_NAME + ' - ' + (pendingPlano || 'Geral'),
            value: pendingValor,
            currency: 'BRL',
          }, { eventID: leadEventId });
        }

        // CAPI server-side parallel (dedup via eventId)
        sendCAPI('Lead', leadEventId, {
          email: undefined, // popup nao pede email
          phone: waNormalized,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || undefined,
          country: 'br',
        }, {
          currency: 'BRL',
          value: pendingValor,
          contentName: SOURCE_NAME + ' - ' + (pendingPlano || 'Geral'),
        });

        // Salva no localStorage
        try {
          localStorage.setItem('lead_name', name);
          localStorage.setItem('lead_phone', waNormalized);
          localStorage.setItem('lead_plano', pendingPlano || '');
        } catch(err) {}

        // POST pro CRM (fire-and-forget)
        sendToCRM({
          firstName: name,
          whatsapp: waNormalized,
          source: 'LANDING_PAGE',
          customFields: {
            plano: pendingPlano || 'Indefinido',
            origem: SOURCE_NAME,
            lpUrl: window.location.href,
          },
        });

        // Redireciona pro checkout (delay 150ms pra garantir envio)
        if (pendingCheckoutUrl) {
          setTimeout(function() { window.location.href = pendingCheckoutUrl; }, 150);
        } else {
          if (popup) popup.classList.remove('active');
        }
        return false;
      }, true);
    }
  });
})();
