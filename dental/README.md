# DENTECH CARES — site du Dr David Siarri (hébreu, RTL)

Site one-page en hébreu pour la clinique de Dr David Siarri, chirurgien-dentiste à Herzliya Pituach, avec une expérience 3D (Three.js + GSAP ScrollTrigger + Lenis) sur un design médical clair.

Le contenu vient du site actuel (davidsiarri.com/he) : biographie et diplômes, Enzo (smile designer), les engagements, « couronne en une séance » (Omnicam + CEREC Sirona, laboratoire intégré), implants Straumann, tout-céramique sans métal, médecine esthétique, téléphone 052-532-6620. Le texte hébreu a été réécrit dans une langue plus naturelle, sans changer les faits.

## La 3D (procédurale, aucun fichier 3D)
- **Hero** : molaire sculptée sous éclairage studio, balayage « scan numérique ».
- **À propos** : implant en vue éclatée au scroll (couronne zircone / pilier / implant).
- **Engagements** : arcade dentaire qui se construit dent par dent sur un socle.
- **Avant / après** : 3 simulations rendues dans le navigateur (blanchiment, facettes, restauration sans métal), marquées « הדמיה ».

## À compléter (absent du site source)
- Horaires et e-mail (adresse, accès et coordonnées GPS : faits).
- Photo d'Enzo (pour l'instant un portrait stylisé).
- Avis : 3 avis vérifiés (WhatClinic, 5.0) traduits de l'anglais + bouton vers les avis Google. Remplacer par des avis Google réels si souhaité.
- `FORM_ENDPOINT` dans `js/app.js` (sinon le formulaire ouvre WhatsApp, numéro `WHATSAPP`).
- Vérifier que le 052-532-6620 est bien joignable sur WhatsApp.

## Lancer
`python3 -m http.server 4192` dans ce dossier → http://localhost:4192
