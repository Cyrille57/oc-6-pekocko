///////////////////////////////////////////////
// app.js /////////////////////////////////////
///////////////////////////////////////////////

// Contient l'application *********************


//////////////////////////////////////////////////////////////////////////////////////////////
// Importe Express :
const express = require("express");

//////////////////////////////////////////////////////////////////////////////////////////////
// Importe Helmet (module Node.js qui aide à sécuriser les en-têtes HTTP,empêcher les attaques telles que le Cross-Site-Scripting (XSS), le détournement de clic, etc..)
const helmet = require("helmet");

//////////////////////////////////////////////////////////////////////////////////////////////
// Importe dotEnv :
const dotEnv = require("dotenv").config();

//////////////////////////////////////////////////////////////////////////////////////////////
// Importe le package body-parser
// pour transformé le corp de la requéte en json en objet Javascript:
const bodyParser = require("body-parser");

//////////////////////////////////////////////////////////////////////////////////////////////
// Importe mongoose
// pour se connecter au cluster MongoDB:
const mongoose = require("mongoose");

//////////////////////////////////////////////////////////////////////////////////////////////
// Accéde au module path qui fournit des utilitaires pour travailler avec les chemins de fichiers et de répertoires:
const path = require("path");

//////////////////////////////////////////////////////////////////////////////////////////////
// Importe les routeur:
const sauceRoutes = require("./routes/sauce");
const userRoutes = require("./routes/user");

//////////////////////////////////////////////////////////////////////////////////////////////
// Connexions à la bdd:
// Variables:

const user = process.env.USERDB;
const password = process.env.PASSWORDDB;
const nameDB = process.env.NAMEDB;

mongoose

  .connect(
    "mongodb+srv://" +
      user +
      ":" +
      password +
      "@cluster0.ncavz.mongodb.net/" +
      nameDB +
      "?retryWrites=true&w=majority", // l'adresse SRV de mongoDB protéger dans le fichier .env
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

//////////////////////////////////////////////////////////////////////////////////////////////
// Creer une application Express:
const app = express();

//////////////////////////////////////////////////////////////////////////////////////////////
app.use(helmet());

//////////////////////////////////////////////////////////////////////////////////////////////
// Etape pour autoriser les connexions à l'API:
// sur l'objet réponse permet l'envoi et la réception de requêtes et de réponses sans erreurs CORS
// Middleware générale, qui ajoute des headers pour permettre l'accées a l'api:

app.use((req, res, next) => {
  // Accéde à l'API depuis le localhost :
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200"); // accés depuis localhost ou si en ligne, mettre l'ip du serveur
  // Ajoute les headers mentionnés aux requêtes envoyées vers l'API:
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  // Envoie des requêtes avec les méthodes ( GET ,POST , etc...):
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

//////////////////////////////////////////////////////////////////////////////////////////////
// Défini la fonction json, qui transforme le corp de la requéte en json en objet Javascript,
// comme middleware global pour l'application:
app.use(bodyParser.json());

//////////////////////////////////////////////////////////////////////////////////////////////
// Gestionnaire de routage ( indique à Express qu'il faut gérer la ressource images de manière statique (un sous-répertoire du répertoire de base, __dirname ) à chaque fois qu'elle reçoit une requête vers la route /images)
app.use("/images", express.static(path.join(__dirname, "images")));

//////////////////////////////////////////////////////////////////////////////////////////////
// Enregistrer les routeur:
app.use("/api/sauces", sauceRoutes);
app.use("/api/auth", userRoutes);

//////////////////////////////////////////////////////////////////////////////////////////////
// Exporte l'application pour y accéder depuis les autres fichiers, notamment du serveur node:
module.exports = app;
