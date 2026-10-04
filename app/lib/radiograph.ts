import { MeshStandardMaterial } from "three";

type Surface = {
  roughness: number;
  normal: number;
  gain: number;
  lift: number;
};

// Converts only the albedo to a cool monochrome. Lighting, roughness and
// normal maps keep the standard PBR response.
export function radiograph(source: MeshStandardMaterial, surface: Surface) {
  const material = source.clone();
  material.color.set("#f2f7fa");
  material.metalness = 0;
  material.metalnessMap = null;
  material.roughness = surface.roughness;
  material.roughnessMap = null;
  material.normalScale.setScalar(surface.normal);
  material.envMapIntensity = 0.3;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
      #include <map_fragment>
      float mono = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      mono = clamp(mono * ${surface.gain.toFixed(2)} + ${surface.lift.toFixed(2)}, 0.0, 1.0);
      diffuseColor.rgb = mix(vec3(0.12, 0.16, 0.19), vec3(0.72, 0.82, 0.87), mono);
      `,
    );
  };
  material.customProgramCacheKey = () => `amber-pbr-monochrome-v2-${surface.gain}-${surface.lift}`;
  return material;
}
