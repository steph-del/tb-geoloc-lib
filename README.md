# TbGeolocLibApp

Le projet est composée de 3 applications :

- **tb-tsb-lib** : la librairie
- **tb-tsb-lib-app** : l'application qui fait tourner la librairie (test)
- **tb-tsb-lib-app-e2e** : les tests e2e (généré automatiquement par Angular)

Voir le fichier [**angular.json**](https://github.com/steph-del/tb-geoloc-lib/blob/master/angular.json) à la racine du projet.

La librairie fonctionne de concert avec Nomiatim

## Installation de la librairie

- `yarn add https://github.com/steph-del/tb-geoloc-lib/releases/download/v0.1.0/tb-geoloc-lib-0.1.0.tgz` (voir la dernière version)
- ou `npm install https://github.com/steph-del/tb-geoloc-lib/releases/download/v0.1.0/tb-geoloc-lib-0.1.0.tgz`
- Dans l'appli principale, vérifier les versions des dépendances (peer dependencies) de la librairie (leaflet, leaflet-draw, angular/common, /core, /material, /cdk, rxjs, ...)
- Importer un thème angular material dans le fichier css (styles.css) de l'application principale :
ex : `@import "~@angular/material/prebuilt-themes/indigo-pink.css";`
- Ajouter les icones Material dans l'index.html de l'application principale :
`<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">`
- Importer les feuilles de styles de leaflet et de leaflet-draw. Dans le fichier angular.json à la racine de votre projet :
```
"styles": [
  "src/styles.css",
  "./node_modules/leaflet/dist/leaflet.css",
  "./node_modules/leaflet-draw/dist/leaflet.draw.css"
]
```


Importer `TbGeolocLibModule` dans `app.module.ts` :`import { TbGeolocLibModule } from 'tb-geoloc-lib'`

## Utilisation du composant `<tb-geoloc-map>`

Exemple d'utilisation :
[**Application test**](https://github.com/steph-del/tb-geoloc-lib/tree/master/src/app)

### Paramètres en entrée @Input

Par défaut, aucun paramètre n'est obligatoire. Si vous vous contentez d'insérer la balise `<tb-geoloc-map></tb-geoloc-map>`, ça fonctionne.


| Paramètre                 | Requis | Type     | Valeurs | Valeur par défaut | Description / Commentaire |
| ---                       | ---    | ---      | ---     | ---               | ---         |
| layersToAdd               |        | Array<string>   | 'osm', 'opentopomap', 'google hybrid', 'brgm' | ['osm'] |  |
| geolocatedPhotoLatLng     |        | Un Observable contenant un tableau de `LatLngDMSAltitudePhotoName` | voir le type | - | cet @Input est soumis à souscription. Les données de géolocalisation sont alors utilisables dans le composant. Fonctionne de concert avec le module `tb-dropbox-lib` |
| osmClassFilter            |        | Array<string> | [Voir les tags OSM](https://github.com/openstreetmap/Nominatim/blob/80df4d3b560f5b1fd550dcf8cdc09a992b69fee0/settings/partitionedtags.def) + [le wiki OSM (ex pour les routes](https://wiki.openstreetmap.org/wiki/Key:highway)) |  | Les paramètres se composent d'une clé et d'une valeur. Ex : 'highway:primary'. On peut utiliser le caractère '*' pour inclure toutes les valeurs de la clé. Ex: 'highway:*'. |
| allowEditDrawnItems       |        | boolean  |          | false            | Active la possibilté d'éditer l'entité dessinées |
| marker                    |        | boolean  |          | true             | Permet de dessiner (placer) un marquer           |
| polygon                   |        | boolean  |          | true             | Permet de dessiner un polygone                   |
| polyline                  |        | boolean  |          | true             | Permet de dessiner une polyligne                 |
| latLngInit                |        | [number, number] |  | [46.55886030, 2.98828125] | Centrage de la carte au démarrage       |
| zoomInit                  |        | number   |          | 4                | Zoom au démarrage de la carte (min et max peuvent dépendre des capacités de la couche affichée par défaut) |
| getOsmSimpleLine          |        | boolean  |          | false            | Si Nominatim renvoie une objet polyline, il sera converti en ligne simple (2 points). Options utilisée pour le programme "Sauvages de ma rue". |
| showLatLngElevationInputs |        | boolean  |          | true             | Affiche les champs de latitude, longitude et altitude. Si false, les données lat, long et altitude sont affichées sous forme de texte et sous la carte.
| reset                     |        | boolean  |          | false            | RAZ du composant si true |

Note : par défaut, les paramètres en entrée d'un composant Angular sont du type `string`. Pour tout autre type de paramètre, ne pas oublier d'indiquer qu'ils doivent être interprétés. Par ex, utiliser `[marker]="false"` plutôt que `marker="false"`.

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
| lngDec      | number                                  | optionnel, si déjà calculé   |

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
