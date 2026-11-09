// Cloudflare Pages ne publie pas les dossiers nommés « node_modules ». Les polices d'icônes
// (@expo/vector-icons) se retrouvaient dans dist/assets/node_modules/… et n'étaient pas servies :
// les icônes s'affichaient comme des carrés. En production, ces fichiers sont rangés dans
// assets/vendor/… (chemin et référence dans le code changés ensemble).
module.exports = function vendorAssetPath(asset) {
  if (process.env.NODE_ENV === 'production' && typeof asset.httpServerLocation === 'string') {
    asset.httpServerLocation = asset.httpServerLocation.replace(/(^|\/)node_modules(\/|$)/g, '$1vendor$2');
  }
  return asset;
};
