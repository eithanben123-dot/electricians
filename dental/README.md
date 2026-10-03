# DENTECH CARES — site du Dr David Siarri (hébreu, RTL)

Site one-page en hébreu pour la clinique de Dr David Siarri, chirurgien-dentiste à Herzliya Pituach, avec une expérience 3D (Three.js + GSAP ScrollTrigger + Lenis) sur un design médical clair.

Le contenu vient du site actuel (davidsiarri.com/he) : biographie et diplômes, Enzo (smile designer), les engagements, « couronne en une séance » (Omnicam + CEREC Sirona, laboratoire intégré), implants Straumann, tout-céramique sans métal, médecine esthétique, téléphone 052-532-6620. Le texte hébreu a été réécrit dans une langue plus naturelle, sans changer les faits.

## La 3D (procédurale, aucun fichier 3D)
- **Hero** : molaire sculptée sous éclairage studio, balayage « scan numérique ».
- **À propos** : implant en vue éclatée au scroll (couronne zircone / pilier / implant).
- **Engagements** : arcade dentaire qui se construit dent par dent sur un socle.
- **Avant / après** : 3 simulations rendues dans le navigateur (blanchiment, facettes, restauration sans métal), marquées « הדמיה ».

## À compléter (absent du site source)
- E-mail (adresse, accès, GPS et horaires dim–jeu 08:00–17:00 : faits ; à confirmer : vendredi, pause déjeuner).
- Photo d'Enzo (pour l'instant un portrait stylisé).
- Avis : 3 avis vérifiés (WhatClinic, 5.0) traduits de l'anglais + bouton vers les avis Google. Remplacer par des avis Google réels si souhaité.
- **Prise de rendez-vous** : tout se règle en haut de `js/booking.js` (horaires, jours fermés `closedDates`, durée par soin, délai minimum, `endpoint` optionnel). Sans `endpoint`, la demande part sur WhatsApp au cabinet ; le patient peut l'ajouter à son agenda (.ics). Les disponibilités réelles (créneaux déjà pris) nécessitent de brancher un agenda (Google Calendar, Calendly, logiciel du cabinet) via `endpoint`.
- Vérifier que le 052-532-6620 est bien joignable sur WhatsApp.

## Lancer
`python3 -m http.server 4192` dans ce dossier → http://localhost:4192
