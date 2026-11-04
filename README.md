# Yo Wallet
Interface Angular : inscription, connexion, tableau de bord, profil, liaison, recharge et retrait.
Utilisateur : http://localhost:8080. Portefeuille : http://localhost:8082. Transactions : http://localhost:8083.
Installation : npm install
Lancement : npx ng serve
Puis ouvrir http://localhost:4200
Jetons dans localStorage (développement ; cookie HttpOnly préférable en production).
Tailwind : tokens dans tailwind.config.js et le bloc @theme de src/styles.css.
Aucun test n'est écrit. Le backend ne doit pas être modifié.
Les erreurs 500 et 503 n'affichent jamais le détail technique.
