# TbGeolocLibApp

Le projet est composée de 3 applications :

- **tb-tsb-lib** : la librairie
- **tb-tsb-lib-app** : l'application qui fait tourner la librairie (test)
- **tb-tsb-lib-app-e2e** : les tests e2e (généré automatiquement par Angular)

Voir le fichier [**angular.json**](https://github.com/steph-del/tb-geoloc-lib/blob/master/angular.json) à la racine du projet.

La librairie fonctionne de concert avec Nomiatim

## Utilisation du composant `<tb-geoloc-map>`

Exemple d'utilisation :
[**Application test**](https://github.com/steph-del/tb-geoloc-lib/tree/master/src/app)

### Paramètres en entrée @Input

Par défaut, aucun paramètre n'est obligatoire. Si vous vous contentez d'insérer la balise `<tb-geoloc-map></tb-geoloc-map>`, ça fonctionne.


| Paramètre                 | Requis | Type     | Valeurs | Valeur par défaut | Description |
| ---                       | ---    | ---      | ---     | ---               | ---         |
| layersToAdd               |        | Array<string>   | ['osm', 'brgm', ...] | ['osm'] | non encore implémenté |
| geolocatedPhotoLatLng     |        | un Observable contenant un tableau de `LatLngDMSAltitudePhotoName` | voir le type | - | cet @Input est soumis à souscription. Les photos géolocalisées sont alors utilisables dans le composant. Fonctionne de concert avec le module `tb-dropbox-lib` |

LatLngDMSAltitudePhotoName (model) :

| Propriété   | Type                                    | Commentaire |
| ---         | ---                                     | ---         |
| lat         | {deg: number, min: number, sec: number} | les données de localisation des appareils photos sont fournies au format DMS |
| lng         | {deg: number, min: number, sec: number} | idem
| altitude    | number                                  |
| photoName   | string                                  | nom du fichier (affiché dans l'infobulle du point de localisation sur la carte |
| latDms      | string                                  | optionnel, si déjà calculé
| lngDms      | string                                  | optionnel, si déjà calculé
| latDec      | number                                  | optionnel, si déjà calculé   |
| lngDec      | numbe                                   | optionnel, si déjà calculé   |

### Paramètres en sortie @Output

| Propriété          | Valeur(s)     | Commentaire |
| ---                | ---           | ---         |
| location           | LocationModel | informations nécessaires à l'enregistrement de la localité en bdd |

LocationModel :

| Propriété           | Type                             | Commentaire |
| ---                 | ---                              | ---         |
| geometry            | geoJson                          | geoJson de l'entité (point, polyligne ou polygone)
| geodatum            | string                           | 
| locality            | string                           |
| elevation           | number                           |
| publishedLocation   | 'précise' | 'localité' | '10x10' | 
| locationAccuracy    | number                           | 
| station             | string                           |
| sublocality         | string                           |
| localityConsistency | boolean                          |
| osmState            | string                           | les données 'osm' sont fournies par Nominatim
| osmCountry          | string                           |
| osmCountryCode      | string                           |
| osmCounty           | string                           |
| osmPostCode         | string                           |
| osmRoad             | string                           |
| osmNeighbourhood    | string                           | 
| osmSuburb           | string                           | 
| osmId               | number                           | 
| osmPlaceId          | number                           | 

## Serveur de développement

Ne pas oublier de reconstruire la librairie avant de servir l'application (`npm run build_serve` fait les deux à la suite).

## Build
-  `npm run build_lib` pour construire la librairie
-  `npm run build_serve` pour construire la librairie et servir l'application principale
-  `npm run build_pack` for construire et packager la librairie


> The --prod meta-flag compiles with AOT by default.


Le build et la package sont dans le répertoire `dist/`.

## Tests unitaires
...
