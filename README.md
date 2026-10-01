# זרם · ZEREM — site 3D pour חשמלאי מוסמך

Site one-page en hébreu (RTL), dark luxury, dont le cœur est une **scène WebGL (Three.js)** que la caméra traverse au scroll. Tout est modélisé en code : aucun fichier 3D, aucune vidéo.

## Le parcours caméra (7 chapitres)

| # | Section | Ce qui se passe en 3D |
|---|---|---|
| 01 | Hero | Ampoule Edison suspendue (verre à transmission réelle, culot laiton fileté, filament « cage » incandescent). Allumage en scintillement + étincelles. Survol = l'ampoule s'intensifie, clic = étincelles. |
| 02 | Manifeste | Macro sur le filament ; le texte s'éclaire mot par mot au scroll. |
| 03 | Chiffres | La caméra remonte le câble tressé ; des impulsions d'énergie circulent dedans. |
| 04 | Services | **Tableau électrique** complet : disjoncteur général, différentiel, 8 disjoncteurs = 8 services. Ils s'enclenchent un par un au scroll. Survol/clic sur un disjoncteur ou un service → il s'allume et la page s'y positionne. |
| 05 | Sécurité | Plaque laiton (interrupteur + prise israélienne type H). **Cliquer l'interrupteur** (3D ou bouton) allume un lavage de lumière sur le mur. |
| 06 | Processus | Câble cuivre torsadé (marron/bleu/vert-jaune), défilement horizontal des 4 étapes. |
| 07 | Contact | Retour sur l'ampoule pleine puissance ; formulaire → ouvre WhatsApp pré-rempli. |

## Lancer en local

```bash
python3 -m http.server 4188    # puis http://localhost:4188
# ou : npx serve
```
(Il faut un serveur : les modules JS ne se chargent pas en `file://`.)

## Fichiers

- `index.html` — contenu et structure (hébreu).
- `style.css` — design (tokens couleurs/typo en haut, responsive en bas).
- `js/scene.js` — toute la 3D : modèles, lumières, bloom, particules, **keyframes caméra** (`KEYFRAMES` en haut du fichier).
- `js/main.js` — scroll fluide (Lenis), synchronisation sections ↔ scène, curseur, formulaire. Numéro WhatsApp : `PHONE_INTL` en haut.
- `vendor/` — Three.js r186 et Lenis, embarqués (pas de dépendance CDN).

Après une modif de `style.css` ou `js/main.js`, incrémente le `?v=` correspondant dans `index.html` pour casser le cache.

## À remplacer avant mise en ligne (contenu fictif)

- Téléphone `052-555-0123` (header, contact) + `PHONE_INTL` dans `js/main.js`
- Numéro de licence `0000000` (footer)
- Chiffres : 17 ans, 2 400 projets, 45 min
- Zones : « מרכז · שרון · שפלה »
- Nom de marque « זרם / ZEREM » si tu as le tien

## Performance & accessibilité

- Mobile : verre sans transmission, pas d'ombres, résolution plafonnée, résolution adaptative si les FPS chutent.
- `prefers-reduced-motion` : pas de scroll lissé, pas d'animations automatiques ni d'étincelles.
- Sans WebGL : fond dégradé statique, tout le contenu reste lisible.

`download-assets.mjs` vient de l'ancien starter vidéo (non utilisé par ce site).
