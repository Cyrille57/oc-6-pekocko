///////////////////////////////////////////////
// Logique globale de l'application (sauce) ///
///////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////
// Importation du models sauce:
const Sauce = require("../models/Sauce");

//////////////////////////////////////////////////////////////////////////////////////////////
// Importation de FS (accées aux opérations liées aux systémes de fichier):
const fs = require("fs");

//////////////////////////////////////////////////////////////////////////////////////////////
// CRUD ***************************************

///////////////////////////////////////////////
// CREATION ///////////////////////////////////
exports.createSauce = (req, res, next) => {
  /**
   *  Le front-end envoie les données de la requête sous la forme form-data, et non sous forme de JSON.
   *  Le corps de la requête contient une chaîne sauce, qui est un objet Sauce converti en chaîne,
   *  il l'analyse à l'aide de JSON.parse() pour obtenir un objet utilisable:
   */
  const sauceObject = JSON.parse(req.body.sauce);

  /**
   * Supprime en amont le champ _id envoyé par le front-end, car il sera généré par mongoDB:
   */
  delete sauceObject._id;

  /**
   * Créez une instance dU modèle Sauce:
   */
  const sauce = new Sauce({
    ...sauceObject, // ... est utilisé pour faire une copie de tous les éléments de req.body

    /**
     * req.protocol obtient le premier segment ('http'),
     * ajoute '://', puis utilise req.get('host') pour résoudre l'hôte du serveur ('localhost:3000'),
     *  et ajoute '/images/' et le nom de fichier pour compléter notre URL:
     */
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    /**
     * Enregistre la sauce dans la base de données:
     */
    .save()
    .then(() => {
      /**
       * Renvoie la réponse de réussite avec un code 201 de réussite:
       */
      res.status(201).json({
        message: "Votre sauce a correctement été ajouter!",
      });
    })
    .catch((error) => {
      /**
       * Réponse avec l'erreur générée par Mongoose ainsi qu'un code d'erreur 400
       */
      res.status(400).json({
        error: error,
      });
    });
};

///////////////////////////////////////////////
// MODIFICATION ///////////////////////////////

exports.modifySauce = (req, res, next) => {
  //Crée un objet sauceObject:
  let sauceObject = {};
  // Regarde si req.file existe ou non:
  req.file
    ? // Si la modification à une image:
      Sauce.findOne({
        // Recoit l'ID comme paramètre pour accéder à la sauce correspondante dans la BDD:
        _id: req.params.id,
      }).then((sauce) => {
        // Utilise le fait de savoir que l'URL d'image contient un segment /images/ pour séparer le nom de fichier:

        const filename = sauce.imageUrl.split("/images/")[1];

        //la fonction unlink du package fs supprime ce fichier:
        fs.unlink(`images/${filename}`, () => {
          sauceObject = {
            // Si existe, traite la nouvelle image:
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
              req.file.filename
            }`,
          };

          // Méthode updateOne() du modèle Sauce, permet de mettre à jour la Sauce qui correspond à l'objet que nous passons comme premier argument.
          // Le paramètre id passé dans la demande le remplace par la Sauce passé comme second argument:
          Sauce.updateOne(
            {
              _id: req.params.id,
            },
            {
              ...sauceObject,
              _id: req.params.id,
            }
          )
            .then(() =>
              res.status(200).json({
                message: "Votre sauce a correctement été modifié !",
              })
            )
            .catch((error) =>
              res.status(400).json({
                error,
              })
            );
        });
      })
    : // Sinon traite l'objet entrant:

      (sauceObject = {
        ...req.body,
      });
  Sauce.updateOne(
    {
      _id: req.params.id,
    },
    {
      ...sauceObject,
      _id: req.params.id,
    }
  )
    .then(() =>
      res.status(200).json({
        message: "Votre sauce a correctement été modifié !",
      })
    )
    .catch((error) =>
      res.status(400).json({
        error,
      })
    );
};

///////////////////////////////////////////////
// SUPPRESION /////////////////////////////////
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({
    /**
     * Recoit l'ID comme paramètre pour accéder à la sauce correspondante dans la BDD:
     */
    _id: req.params.id,
  })
    .then((sauce) => {
      /**
       * Utilise le fait de savoir que l'URL d'image contient un segment /images/ pour séparer le nom de fichier:
       */
      const filename = sauce.imageUrl.split("/images/")[1];

      /**
       * la fonction unlink du package fs supprime ce fichier:
       */
      fs.unlink(`images/${filename}`, () => {
        /**
         * Dans le callback, implémente la logique d'origine, en supprimant la sauce de la BDD:
         */
        Sauce.deleteOne({
          _id: req.params.id,
        })
          .then(() =>
            res.status(200).json({
              message: "Votre sauce a correctement été supprimé !",
            })
          )
          .catch((error) =>
            res.status(400).json({
              error,
            })
          );
      });
    })
    .catch((error) =>
      res.status(500).json({
        error,
      })
    );
};

///////////////////////////////////////////////
// LECTURE ////////////////////////////////////
exports.getOneSauce = (req, res, next) => {
  /**
   * Méthode findOne() du modèle Sauce pour trouver la Sauce unique
   * ayant le même _id que le paramètre de la requête:
   */
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      /**
       * La Sauce est ensuite retourné dans une Promise et envoyé au front-end:
       */
      res.status(200).json(sauce);
    })
    .catch((error) => {
      /**
       * Si aucune SAUCE n'est trouvé ou si une erreur se produit,
       * envoie une erreur 404 au front-end, avec l'erreur générée:
       */
      res.status(404).json({
        error: error,
      });
    });
};

///////////////////////////////////////////////
// LECTURE ALL/////////////////////////////////
exports.getAllSauces = (req, res, next) => {
  /**
   * Méthode find() du modèle Mongoose afin de renvoyer un tableau
   * contenant toutes les Sauces dans la base de données:
   */
  Sauce.find()
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

///////////////////////////////////////////////
// Like, dislikes /////////////////////////////

exports.createLikeDislakeSauce = (req, res, next) => {
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Si l'utilisateur aime la sauce:
  if (req.body.like === 1) {
    Sauce.updateOne(
      {
        // Récupére l'id de la sauce:
        _id: req.params.id,
      },
      {
        $inc: {
          // Incrémente de 1 le nombre de likes
          likes: req.body.like++,
        },
        $push: {
          // Pousse userId dans le tableau userLiked
          usersLiked: req.body.userId,
        },
      }
    )
      .then(() =>
        res.status(200).json({
          message: "Like pris en compte !",
        })
      )
      .catch((error) =>
        res.status(400).json({
          error,
        })
      );
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Si l'utilisateur n'aime pas la sauce
  if (req.body.like === -1) {
    Sauce.updateOne(
      {
        // Récupére l'id de la sauce:
        _id: req.params.id,
      },
      {
        $inc: {
          // Incrémente de 1 le nombre de dislikes
          dislikes: req.body.like++ * -1,
        },
        $push: {
          // Pousse userId dans le tableau userDislikes
          usersDisliked: req.body.userId,
        },
      }
    )
      .then(() =>
        res.status(200).json({
          message: "Like pris en compte !",
        })
      )
      .catch((error) =>
        res.status(400).json({
          error,
        })
      );
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Si l'utilisateur ANNULE ce qu'il aime ou n'aime pas
  else if (req.body.like === 0) {
    // Cherche l'id de la sauce:
    Sauce.findOne({
      _id: req.params.id,
    })
      .then((sauce) => {
        //////////////////////////////////////////////////////////////////////////////////////////////
        // Annule le like
        if (sauce.usersLiked.includes(req.body.userId)) {
          // QUand la sauce est trouvé, vérifie si id de l'user est contenu dans letableau userLiked
          Sauce.updateOne(
            {
              // Si oui, recupére l'id de la sauce:
              _id: req.params.id,
            },
            {
              // Supprime l'userId du tableau userLiked:
              $pull: {
                usersLiked: req.body.userId,
              },
              // Retire un like:
              $inc: {
                likes: -1,
              },
            }
          )
            .then((sauce) => {
              res.status(200).json({
                message: "Like supprimé !",
              });
            })
            .catch((error) =>
              res.status(400).json({
                error,
              })
            );
          //////////////////////////////////////////////////////////////////////////////////////////////
          // Annule le dislike
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          // Sinon, vérifie si id de l'user est contenu dans letableau userdisLiked
          Sauce.updateOne(
            {
              _id: req.params.id,
            },
            {
              // Supprime l'userId du tableau usersDisliked:
              $pull: {
                usersDisliked: req.body.userId,
              },
              // Retire un dislikes:
              $inc: {
                dislikes: -1,
              },
            }
          )
            .then((sauce) => {
              res.status(200).json({
                message: "Dislike supprimé !",
              });
            })
            .catch((error) =>
              res.status(400).json({
                error,
              })
            );
        }
      })
      .catch((error) =>
        res.status(400).json({
          error,
        })
      );
  }
};
