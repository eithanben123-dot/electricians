# אלמה — site premium pour clinique dentaire (hébreu, RTL)

Site one-page en hébreu avec une expérience 3D (Three.js + GSAP ScrollTrigger + Lenis), sur un design médical clair (blanc cassé, bleu marine, bleu).

## La 3D (tout est modélisé en code, aucun fichier 3D)
- **Hero** : molaire sculptée (cuspides, sillons, racines, émail→dentine) sous éclairage studio, balayage « scan numérique » discret, réagit à la souris.
- **À propos** (section épinglée) : implant en vue éclatée au scroll — couronne zircone, pilier, implant titane fileté, avec étiquettes.
- **Processus** (section épinglée) : une arcade dentaire complète se construit dent par dent au fil des 4 étapes, sur un socle givré.
- **Avant / après** : 3 simulations (blanchiment, facettes, orthodontie) rendues en 3D dans le navigateur, avec curseur glissant. Elles sont marquées « הדמיה » (simulation).

## À remplacer avant mise en ligne
- **Photos des médecins** : déposer `assets/team/noa-barak.jpg`, `itay-levi.jpg`, `michal-adler.jpg` (format 4:5). Tant qu'elles manquent, un portrait stylisé s'affiche.
- **Médecins, avis Google et témoignages** : contenus d'exemple → remplacer par les vrais (avec l'accord des patients).
- **Coordonnées** : téléphone `03-555-0123`, WhatsApp `972535550123` (aussi `WHATSAPP` dans `js/app.js`), adresse, horaires, domaine (`canonical`, JSON-LD).
- **Formulaire** : renseigner `FORM_ENDPOINT` dans `js/app.js` (CRM / service e-mail). Sinon, l'envoi ouvre WhatsApp pré-rempli.
- **Pages légales** : `privacy.html` et `accessibility.html` — compléter les champs entre crochets.

## Lancer
`python3 -m http.server 4192` dans ce dossier → http://localhost:4192
