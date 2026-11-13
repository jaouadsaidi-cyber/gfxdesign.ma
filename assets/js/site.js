/* GfxDesign — comportements du site : menu, en-tête, lien actif, formulaire de contact. */
(function () {
  "use strict";

  /* En-tête : fond plus opaque dès qu'on fait défiler la page */
  var entete = document.querySelector("[data-entete]");
  function majEntete() { entete.classList.toggle("entete--defile", window.scrollY > 24); }
  majEntete();
  window.addEventListener("scroll", majEntete, { passive: true });

  /* Menu sur téléphone et tablette */
  var bouton = document.querySelector(".entete__menu");
  var nav = document.getElementById("nav");
  function basculer(ouvrir) {
    bouton.setAttribute("aria-expanded", String(ouvrir));
    bouton.setAttribute("aria-label", bouton.dataset[ouvrir ? "fermer" : "ouvrir"]);
    nav.classList.toggle("nav--ouverte", ouvrir);
    document.body.style.overflow = ouvrir ? "hidden" : "";
  }
  bouton.addEventListener("click", function () { basculer(bouton.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) basculer(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("nav--ouverte")) { basculer(false); bouton.focus(); }
  });
  window.matchMedia("(min-width: 1101px)").addEventListener("change", function (m) { if (m.matches) basculer(false); });

  /* Lien de menu de la section visible */
  var liens = Array.prototype.slice.call(document.querySelectorAll(".nav__liens a"));
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        liens.forEach(function (a) {
          if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    liens.forEach(function (a) {
      var h = a.getAttribute("href");
      var s = h.charAt(0) === "#" ? document.querySelector(h) : null;  // autres pages : liens « /#section »
      if (s) obs.observe(s);
    });
  }

  /* Formulaire de contact
     - data-adresse renseigné : envoi au script Google (tableur + alerte e-mail) ;
     - sinon : ouverture de la messagerie du visiteur avec la demande pré-remplie. */
  var form = document.querySelector("[data-formulaire]");
  if (!form) return;
  var ouvert = Date.now();
  var retour = form.querySelector(".formulaire__retour");
  var envoyer = form.querySelector('button[type="submit"]');
  var libelle = envoyer.innerHTML;

  function message(texte, etat) {
    retour.textContent = texte;
    retour.className = "formulaire__retour" + (etat ? " est-" + etat : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = {
      nom: form.nom.value.trim(), societe: form.societe.value.trim(), email: form.email.value.trim(),
      tel: form.tel.value.trim(), message: form.message.value.trim(), site: form.site.value,
      langue: form.dataset.langue, page: location.href, duree: Date.now() - ouvert
    };
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
    form.nom.setAttribute("aria-invalid", String(!d.nom));
    form.email.setAttribute("aria-invalid", String(!emailOk));
    form.message.setAttribute("aria-invalid", String(!d.message));
    if (!d.nom || !emailOk || !d.message) {
      message(form.dataset.msgChamps, "erreur");
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    var adresse = form.dataset.adresse;
    if (!adresse) {
      var corps = [d.message, "", d.nom, d.societe, d.tel, d.email].filter(Boolean).join("\n");
      location.href = "mailto:info@gfxdesign.ma?subject=" + encodeURIComponent(form.dataset.sujet) +
        "&body=" + encodeURIComponent(corps);
      return;
    }

    envoyer.disabled = true;
    envoyer.textContent = form.dataset.msgEnvoi;
    message("", "");
    fetch(adresse, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r.ok) { form.reset(); ouvert = Date.now(); message(form.dataset.msgOk, "ok"); }
        else message(r && r.erreur === "champs" ? form.dataset.msgChamps : form.dataset.msgErreur, "erreur");
      })
      .catch(function () { message(form.dataset.msgErreur, "erreur"); })
      .then(function () { envoyer.disabled = false; envoyer.innerHTML = libelle; });
  });
})();
