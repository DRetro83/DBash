#!/usr/bin/env bash
# Build DBash: the AppImage, the standalone dbash-<version>.sh and SHA256SUMS, all in dist/.
#   scripts/build.sh            build everything
#   scripts/build.sh --sh-only  only (re)make the .sh from an AppImage that is already built
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(sed -n 's/^version = "\(.*\)"/\1/p' src-tauri/Cargo.toml | head -1)
APP_VER=$(sed -n "s/^const DBASH_VERSIE='\(.*\)';/\1/p" src/js/app.js)
[ "$VERSION" = "$APP_VER" ] || { echo "Version mismatch: Cargo.toml $VERSION, app.js $APP_VER"; exit 1; }
grep -q "\"version\": \"$VERSION\"" src-tauri/tauri.conf.json || { echo "Version mismatch in tauri.conf.json"; exit 1; }

if [ "${1:-}" != "--sh-only" ]; then
    npm ci --no-audit --no-fund
    NO_STRIP=true npx tauri build --bundles appimage
fi
IMG=$(ls src-tauri/target/release/bundle/appimage/DBash_"$VERSION"_*.AppImage | head -1)
mkdir -p dist
cp "$IMG" "dist/DBash-$VERSION-x86_64.AppImage"

# standalone .sh = small bash header + tar.gz with the AppImage and the icon
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cp "$IMG" "$T/DBash.AppImage"
cp src-tauri/icons/128x128.png "$T/dbash.png"
tar -czf "$T/payload.tgz" -C "$T" DBash.AppImage dbash.png
sed "s/@VERSION@/$VERSION/g" packaging/dbash-sh-head.sh > "dist/dbash-$VERSION.sh"
cat "$T/payload.tgz" >> "dist/dbash-$VERSION.sh"
chmod +x "dist/dbash-$VERSION.sh"
cp scripts/dbash-get-models.sh dist/

(cd dist && sha256sum "dbash-$VERSION.sh" "DBash-$VERSION-x86_64.AppImage" dbash-get-models.sh > SHA256SUMS)
echo "Done:"; ls -la dist
