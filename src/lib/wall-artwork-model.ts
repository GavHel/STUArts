import { Mesh, MeshStandardMaterial, PlaneGeometry, Scene, SRGBColorSpace, Texture } from "three";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

export function createWallArtwork(image: HTMLImageElement, widthInches: number) {
  const width = widthInches * 0.0254;
  const height = width * image.naturalHeight / image.naturalWidth;
  const texture = new Texture(image);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  const geometry = new PlaneGeometry(width, height);
  const material = new MeshStandardMaterial({ map: texture, roughness: 1 });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  return {
    scene,
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

export function exportWallUsdz(scene: Scene) {
  return new USDZExporter().parseAsync(scene, {
    includeAnchoringProperties: false,
    maxTextureSize: 2048,
  });
}
