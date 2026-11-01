# Yo Wallet
Interface Angular : inscription, connexion, tableau de bord et profil.
L'API utilisateur est http://localhost:8081 (CORS limité à localhost:4200).
Installation : npm install
Lancement : npx ng serve
Puis ouvrir http://localhost:4200
Jetons dans localStorage (développement ; cookie HttpOnly préférable en production).
Tailwind : tokens dans tailwind.config.js et le bloc @theme de src/styles.css.
Aucun test n'est écrit. Le backend ne doit pas être modifié.
Les erreurs 500 et 503 affichent un message générique, jamais le détail technique.
