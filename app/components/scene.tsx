// oxlint-disable react/immutability, react/refs

import { ContactShadows, Html, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ToneMapping, wrapEffect } from "@react-three/postprocessing";
import gsap from "gsap";
import { usePersistentTransition } from "hyperkinetic";
import { BokehEffect, Effect, ToneMappingMode } from "postprocessing";
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Box3,
  Group,
  MathUtils,
  PCFShadowMap,
  Vector3,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  type ShaderMaterial,
  type PerspectiveCamera,
} from "three";

import { AmberIcon } from "@/components/logo";
import { landing, lean, leanTilt, snap, spin, useArchive } from "@/lib/archive";
import { radiograph } from "@/lib/radiograph";
import { sceneReady } from "@/lib/scene";
import { indexAt, models, specimenIndex, specimens, step } from "@/lib/specimens";
import { pad } from "@/lib/utils";

// The platform's navigation moves live inside a layout effect, next to the
// transforms and materials they read. The ref hands them to the persistent
// recipe without recreating it on every navigation.
type SceneTransition = {
  transition: (
    timeline: gsap.core.Timeline,
    currentPath: string,
    nextPath: string,
    position: number,
    initial: boolean,
  ) => void;
  complete: (pathname: string) => void;
  // Re-aims the resting detail specimen at the reticle after a resize.
  fit: () => void;
};

const urls = models.map((model) => model.url);
// Specimen groups rest at REST_Y, the height every transition was tuned
// around. The fitted clone sits SEAT below its group's origin instead, so the
// feet meet the platform surface while the group paths never dip near it.
const REST_Y = 0.06;
const SEAT = 0.04;
// ContactShadows bakes whatever its layer-0 camera sees; the amber lives on
// this layer so the bake skips it (it casts no shadow by design).
const UNSHADOWED_LAYER = 1;
// DepthOfField keeps its blur mask in the alpha channel and turns the
// transparent canvas opaque; Bokeh blurs RGBA as is.
const Bokeh = wrapEffect(BokehEffect);
// The scene renders premultiplied over the transparent clear; tone mapping and
// the sRGB encode need straight colour or every edge gains a bright fringe.
// The canvas then composites it with premultipliedAlpha off.
const Straight = wrapEffect(
  class extends Effect {
    constructor() {
      super(
        "Straight",
        "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = vec4(inputColor.rgb / max(inputColor.a, 0.0001), inputColor.a); }",
      );
    }
  },
);
// Home caption lives in the route DOM; only the offline fallback reveals it.
const caption = () => document.querySelector<HTMLElement>("[data-caption]");

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Offline>
        <p>Specimen display offline</p>
        <p className="mt-2">Please reload to reconnect.</p>
      </Offline>
    ) : (
      this.props.children
    );
  }
}

function Offline({ children }: { children: ReactNode }) {
  useEffect(() => {
    sceneReady.resolve();
    const text = caption();
    if (text) text.style.opacity = "1";
  }, []);
  return (
    <div role="alert" className="absolute inset-0 grid place-content-center text-center text-xs">
      {children}
    </div>
  );
}

// The platform calls this once its shaders are warm, before releasing the
// transition, so the readout is gone before the scene enters. Module-level:
// the loader is DOM, the platform lives inside the canvas.
let dismiss: () => Promise<void> = () => Promise.resolve();

// A DOM overlay rather than a Suspense fallback: the fallback unmounts the instant
// the last file lands, before the readout can reach 100. This one tweens to the
// loading manager's count and waits for the platform to dismiss it.
function Loader({ stage }: { stage: RefObject<HTMLCanvasElement | null> }) {
  const progress = useProgress((state) => state.progress);
  const { motion } = useArchive();
  const reduced = motion.current.reduced;
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const shown = useRef({ value: 0 });
  const tween = useRef<gsap.core.Tween>(null);
  const finishing = useRef<Promise<void> | null>(null);
  // Remount after readiness (HMR, StrictMode): nothing will dismiss it again.
  const [done, setDone] = useState(() => sceneReady.settled);

  const show = useCallback(
    (value: number, duration: number) => {
      tween.current?.kill();
      tween.current = gsap.to(shown.current, {
        value,
        duration: reduced ? 0 : duration,
        ease: "power2.out",
        onUpdate: () => {
          if (!count.current) return;
          count.current.textContent = pad(Math.round(shown.current.value), 3);
        },
      });
      return tween.current;
    },
    [reduced],
  );

  useEffect(() => {
    if (done || finishing.current) return;
    // The loading manager reports each batch separately; the readout never
    // goes backwards, and only shader readiness may take it to 100.
    show(Math.max(shown.current.value, Math.min(progress, 99)), 0.8);
  }, [done, progress, show]);

  useEffect(() => {
    if (done) return;
    dismiss = () => {
      if (finishing.current) return finishing.current;
      finishing.current = new Promise((resolve) => {
        show(100, 0.25).then(() => {
          // Crossfade with the canvas: a direct detail load already has its
          // specimen in place, so the stage stays hidden until the readout goes.
          const duration = reduced ? 0 : 0.35;
          gsap.to(stage.current, { opacity: 1, duration });
          gsap.to(root.current, {
            autoAlpha: 0,
            duration,
            onComplete: () => {
              setDone(true);
              resolve();
            },
          });
        });
      });
      return finishing.current;
    };
    return () => {
      tween.current?.kill();
      finishing.current = null;
      dismiss = () => Promise.resolve();
    };
  }, [done, reduced, show, stage]);

  if (done) return null;
  return (
    <div ref={root} className="pointer-events-none absolute inset-0 grid place-content-center">
      <div className="flex flex-col items-center gap-6 font-display text-[10px] leading-none">
        <div className="loader-amber" aria-hidden="true">
          <AmberIcon className="h-10 sm:h-11" />
        </div>
        <div className="flex items-baseline gap-4">
          <p role="status" className="tracking-[0.2em] whitespace-nowrap">
            Loading specimens
          </p>
          {/* Hidden from readers: a value that changes every frame would drown the status. */}
          <p aria-hidden="true" className="text-muted tabular-nums">
            <span ref={count}>000</span>%
          </p>
        </div>
      </div>
    </div>
  );
}

function Camera() {
  const { camera, size } = useThree();
  // Layout effect: Platform positions the detail specimen from this projection
  // in its own layout effect, and Camera renders first in the tree.
  useLayoutEffect(() => {
    const perspective = camera as PerspectiveCamera;
    const height = size.height * (size.width >= 640 ? 0.77 : 0.79);
    const aspect = size.width / height;
    perspective.fov = MathUtils.radToDeg(2 * Math.atan(Math.max(3, 6.7 / aspect) / 12));
    // Extend rendering below the original frame without moving or scaling it.
    perspective.setViewOffset(size.width, height, 0, 0, size.width, size.height);
    camera.position.set(0, 2.1, 13.6);
    camera.lookAt(0, 1.0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, size]);
  return null;
}

// Home tooltip leader, in CSS px: `rise` is the 45° leg's extent on both axes,
// `run` the horizontal leg's length.
const LEADER = { rise: 90, run: 150 };

function Specimen({
  index,
  model,
  setRef,
  setFlash,
  onSelect,
  showLabel,
}: {
  index: number;
  model: Group;
  setRef: (node: Group | null) => void;
  setFlash: (index: number, flash: (() => void) | null) => void;
  onSelect: (index: number) => void;
  showLabel: boolean;
}) {
  // Own material clones: shared models would otherwise glow together on hover.
  const { object, materials } = useMemo(() => {
    const object = model.clone(true);
    const owned = new Map<Material, MeshStandardMaterial>();
    const own = (source: Material) => {
      if (!owned.has(source)) {
        const material = (source as MeshStandardMaterial).clone();
        // clone() drops the instance hooks radiograph attached; restore the monochrome pass.
        material.onBeforeCompile = source.onBeforeCompile;
        material.customProgramCacheKey = source.customProgramCacheKey;
        material.emissive.set("#9fd6ff");
        material.emissiveIntensity = 0;
        owned.set(source, material);
      }
      return owned.get(source)!;
    };
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.material = Array.isArray(child.material)
        ? child.material.map(own)
        : own(child.material);
    });
    return { object, materials: [...owned.values()] };
  }, [model]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  // Hit volume: the whole footprint reacts, not just the mesh silhouette.
  const bounds = useMemo(() => {
    const box = new Box3().setFromObject(object);
    return {
      size: box.getSize(new Vector3()).multiplyScalar(1.05),
      center: box.getCenter(new Vector3()),
    };
  }, [object]);
  const invalidate = useThree((state) => state.invalidate);
  const root = useRef<Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const point = useMemo(() => new Vector3(), []);
  const angle = index * step;
  const specimen = specimens[index];
  // Emissive flash that settles into a held glow, shared by hover and the
  // detail-arrival replay below.
  const flash = (hold: number) => {
    gsap.killTweensOf(materials);
    gsap
      .timeline({ onUpdate: invalidate })
      .to(materials, {
        emissiveIntensity: 1,
        duration: 0.1,
        ease: "power1.out",
      })
      .to(materials, {
        emissiveIntensity: hold,
        duration: 0.4,
        ease: "power2.out",
      });
  };
  const reveal = (visible: boolean) => {
    if (!label.current || (visible && !showLabel)) return;
    const surface = document.querySelector<HTMLElement>("[data-archive]");
    if (surface) surface.style.cursor = visible ? "pointer" : "";
    gsap.killTweensOf(label.current);
    if (visible) {
      // Hard-stepped flicker: the label strobes on like a readout, no fade.
      gsap.to(label.current, {
        keyframes: { opacity: [0, 1, 0.15, 1, 0.4, 1], easeEach: "steps(1)" },
        duration: 0.32,
        ease: "none",
      });
      flash(0.3);
      return;
    }
    gsap.to(label.current, { opacity: 0, duration: 0.15, ease: "none" });
    gsap.to(materials, {
      emissiveIntensity: 0,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: invalidate,
    });
  };
  // Leaving home mid-hover: pointerout never fires once the specimen moves away.
  // Keyed on the label switch only: `reveal` is a fresh closure every render.
  useEffect(() => {
    if (!showLabel) reveal(false);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [showLabel]);
  // Registers the flash-to-off replay Platform triggers once this specimen
  // has settled into the detail position. Re-registered when the materials
  // change, not on every render's new `flash` closure.
  useEffect(() => {
    setFlash(index, () => flash(0));
    return () => setFlash(index, null);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [index, materials]);
  useFrame(({ camera }) => {
    if (!root.current || !label.current) return;
    root.current.getWorldPosition(point).applyMatrix4(camera.matrixWorldInverse);
    const blur = MathUtils.clamp((-point.z - 10.5) * 0.55, 0, 3.5);
    label.current.style.filter = blur < 0.1 ? "none" : `blur(${blur.toFixed(2)}px)`;
  });
  return (
    <group
      ref={(node) => {
        root.current = node;
        setRef(node);
      }}
      position={[Math.sin(angle) * 4.95, REST_Y, Math.cos(angle) * 4.95]}
      rotation={[0, angle - 0.95, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
      onPointerDown={() => {
        // On press, not click: click waits for release and then shares its
        // frame with the navigation's render work, which delays the first tween frames.
        if (!showLabel) return;
        // Press feedback on the model itself: the root group belongs to the
        // navigation timeline. The model carries its fit scale and pivots on
        // its feet, so it shrinks toward the platform rather than into it.
        const fit = model.scale.x;
        gsap.killTweensOf(object.scale);
        gsap
          .timeline({ onUpdate: invalidate })
          .to(object.scale, {
            x: fit * 0.965,
            y: fit * 0.965,
            z: fit * 0.965,
            duration: 0.1,
            ease: "power2.out",
          })
          .to(object.scale, { x: fit, y: fit, z: fit, duration: 0.3, ease: "power2.inOut" });
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        reveal(true);
      }}
      onPointerOut={() => reveal(false)}
    >
      <primitive object={object} dispose={null} />
      <mesh position={bounds.center} visible={false}>
        <boxGeometry args={[bounds.size.x, bounds.size.y, bounds.size.z]} />
      </mesh>
      <Html
        position={[0, Number(model.userData.height) * models[specimen.model].waist, 0]}
        zIndexRange={[20, 1]}
        style={{ pointerEvents: "none", opacity: showLabel ? undefined : 0 }}
      >
        {/* Anchored on the specimen's centre: the dot sits there, a 45° leg
            climbs up-right to a corner, and a horizontal leg carries the
            readout clear of the body. One polyline keeps the joint seamless. */}
        <div
          ref={label}
          data-specimen-label=""
          aria-hidden="true"
          className="relative origin-bottom-left font-display leading-tight text-black opacity-0 will-change-[filter] max-sm:scale-[0.55]"
        >
          <svg
            className="absolute bottom-0 left-0 overflow-visible"
            width={LEADER.run + LEADER.rise}
            height={LEADER.rise}
            viewBox={`0 0 ${LEADER.run + LEADER.rise} ${LEADER.rise}`}
          >
            <polyline
              points={`${LEADER.run + LEADER.rise},0 ${LEADER.rise},0 0,${LEADER.rise}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />
            <circle cx={0} cy={LEADER.rise} r={7} fill="currentColor" />
          </svg>
          {/* Right-aligned so the readout's edge meets the horizontal leg's far end. */}
          <span
            className="absolute text-right whitespace-nowrap"
            style={{
              bottom: LEADER.rise + 10,
              right: -(LEADER.rise + LEADER.run),
            }}
          >
            <span className="block text-2xl">{pad(index + 1)}</span>
            <span className="text-base">{specimen.code}</span>
          </span>
        </div>
      </Html>
    </group>
  );
}

function Amber({ reveal }: { reveal: RefObject<{ amount: number }> }) {
  const { scene } = useGLTF("/models/amber.glb");
  const root = useRef<Group>(null);
  const warmed = useRef(false);
  const { motion } = useArchive();
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.layers.enable(UNSHADOWED_LAYER);
    return () => {
      camera.layers.disable(UNSHADOWED_LAYER);
    };
  }, [camera]);
  // The amber is the only transmissive material in the scene and never covers
  // more than a few hundred pixels, but its refraction target is re-rendered
  // and re-mipmapped at full viewport size every frame. Half the resolution is
  // a quarter of that, and the refraction is already roughness-blurred.
  useEffect(() => {
    const previous = gl.transmissionResolutionScale;
    gl.transmissionResolutionScale = 0.5;
    return () => {
      gl.transmissionResolutionScale = previous;
    };
  }, [gl]);
  const object = useMemo(() => {
    const wrapper = new Group();
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    clone.position.sub(center);
    wrapper.add(clone);
    wrapper.scale.setScalar(0.91 / Math.max(size.x, size.y, size.z));
    wrapper.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.layers.set(UNSHADOWED_LAYER);
        const multiple = Array.isArray(child.material);
        const materials: Material[] = multiple ? child.material : [child.material];
        const nextMaterials = materials.map((source) => {
          const material = source.clone();
          const name = `${child.name} ${material.name}`.toLowerCase();
          if (name.includes("amber") && material instanceof MeshPhysicalMaterial) {
            // The baked inclusions map is dark and mottled, which reads as an
            // opaque rock once it tints the transmission; keep only the normal
            // map for surface detail. Transmission, rather than alpha
            // blending, exposes the enclosed mosquito.
            child.castShadow = false;
            child.receiveShadow = false;
            material.map = null;
            material.color.set("#febf00");
            // A faint warm emissive reads as light trapped inside the stone;
            // there is no env map, so envMapIntensity does nothing here.
            material.emissive.set("#7a5a00");
            material.emissiveIntensity = 0.22;
            material.metalness = 0;
            // Roughness blurs the transmission buffer; the model ships a
            // rough metallicRoughness map that would override the scalar.
            material.roughnessMap = null;
            material.metalnessMap = null;
            material.roughness = 0.22;
            material.normalScale.setScalar(0.45);
            material.transmission = 0.96;
            material.ior = 1.54;
            // Honey tint comes from attenuation through the volume, so the
            // stone stays clear at the edges and deepens toward the centre.
            material.thickness = 0.3;
            material.attenuationColor.set("#e8a000");
            material.attenuationDistance = 0.7;
            material.clearcoat = 0.08;
            material.clearcoatRoughness = 0.3;
            material.envMapIntensity = 1;
            material.opacity = 1;
            material.transparent = false;
            material.depthWrite = true;
          } else if (name.includes("mosquito") && material instanceof MeshStandardMaterial) {
            material.color.set("#38200c");
          }
          material.needsUpdate = true;
          return material;
        });
        child.material = multiple ? nextMaterials : nextMaterials[0];
      }
    });
    return wrapper;
  }, [scene]);
  useEffect(
    () => () => {
      object.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) =>
          material.dispose(),
        );
      });
    },
    [object],
  );

  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    const amount = reveal.current.amount;
    const visible = amount > 0;
    // Transmission builds its render target — and re-keys every program for it —
    // the first frame the amber is drawn. Paid once here at zero scale, it would
    // otherwise land 0.9s into the intro, exactly when the amber pops in.
    root.current.visible = visible || !warmed.current;
    warmed.current = true;
    root.current.scale.setScalar(amount);
    if (visible) {
      root.current.rotation.y += delta * 0.32;
      root.current.position.y = motion.current.reduced
        ? 1.35
        : 1.35 + Math.sin(clock.elapsedTime * 1.35) * 0.055;
    }
    if (visible) invalidate();
  });

  return (
    <group ref={root} position={[0, 1.35, 0]}>
      <primitive object={object} dispose={null} />
    </group>
  );
}

function Platform({ pathname, onSelect }: { pathname: string; onSelect: (index: number) => void }) {
  // Array loading starts all unique assets together and caches each URL once.
  const loaded = useGLTF(urls, false);
  const prepared = useMemo(
    () =>
      loaded.map(({ scene }, index) => {
        const group = new Group();
        const clone = scene.clone(true);
        clone.rotation.y += models[index].rotation;
        group.add(clone);
        const box = new Box3().setFromObject(group);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());
        const scale = Math.min(
          (models[index].length * 0.88) / Math.max(size.x, size.z),
          models[index].maxHeight / size.y,
        );
        clone.position.sub(
          // SEAT is a world distance; the clone offset scales with the fit.
          new Vector3(center.x, box.min.y + SEAT / scale, center.z + size.z * models[index].pivot),
        );
        group.scale.setScalar(scale);
        group.userData.height = size.y * scale;
        const materials = new Map<MeshStandardMaterial, MeshStandardMaterial>();
        const convert = (source: MeshStandardMaterial) => {
          if (!materials.has(source)) {
            materials.set(source, radiograph(source, models[index].surface));
          }
          return materials.get(source)!;
        };
        group.traverse((child) => {
          if (!(child instanceof Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = Array.isArray(child.material)
            ? child.material.map(convert)
            : convert(child.material);
        });
        return group;
      }),
    [loaded],
  );
  useEffect(
    () => () => {
      const materials = new Set<MeshStandardMaterial>();
      prepared.forEach((group) =>
        group.traverse((child) => {
          if (child instanceof Mesh) {
            (Array.isArray(child.material) ? child.material : [child.material]).forEach(
              (material) => materials.add(material),
            );
          }
        }),
      );
      materials.forEach((material) => material.dispose());
    },
    [prepared],
  );
  const group = useRef<Group>(null);
  const stage = useRef<Group>(null);
  const items = useRef<Array<Group | null>>([]);
  const flashes = useRef<Array<(() => void) | null>>([]);
  const selected = useRef(-1);
  const spinning = useRef(false);
  // A run owns the transforms until it completes; a resize meanwhile waits.
  const moving = useRef(false);
  const initialized = useRef(false);
  const warming = useRef(false);
  const culling = useRef(false);
  const amber = useRef({ amount: 0 });
  const controller = useRef<SceneTransition | null>(null);
  const { motion, setActive } = useArchive();
  const previous = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useEffect(() => {
    const state = motion.current;
    state.invalidate = invalidate;
    return () => {
      state.invalidate = undefined;
    };
  }, [motion, invalidate]);
  useLayoutEffect(() => {
    const platform = group.current;
    const base = stage.current;
    if (!platform || !base || items.current.some((item) => !item)) return;

    const homeTransform = (index: number) => {
      const angle = index * step;
      return {
        x: Math.sin(angle) * 4.95,
        z: Math.cos(angle) * 4.95,
        rotation: angle - 0.95,
      };
    };
    // `shift` slides the anchor sideways in screen space, for the specimen that
    // makes way and the one that arrives when browsing between details.
    const detailTransform = (platformAngle: number, index: number, shift = 0) => {
      const height = Number(prepared[specimens[index].model].userData.height);
      const scale = models[specimens[index].model].detailScale;
      // The detail owns the full viewport below `lg`; desktop keeps the
      // right-column reticle whose centre sits at 68% of the viewport.
      const anchorX = gl.domElement.clientWidth < 1024 ? 0 : 0.36;
      const anchor = new Vector3(anchorX + shift, 0.06, 0.5)
        .unproject(camera)
        .applyMatrix4(camera.matrixWorldInverse);
      anchor.multiplyScalar(-11.1 / anchor.z).applyMatrix4(camera.matrixWorld);
      return {
        x: Math.cos(platformAngle) * anchor.x - Math.sin(platformAngle) * anchor.z,
        z: Math.sin(platformAngle) * anchor.x + Math.cos(platformAngle) * anchor.z,
        y: anchor.y - (height * scale) / 2,
        rotation: -0.72 - platformAngle,
      };
    };
    const labels = () => document.querySelectorAll<HTMLElement>("[data-specimen-label]");
    const nearestAngle = (target: number, current: number) =>
      current + Math.atan2(Math.sin(target - current), Math.cos(target - current));
    // Turns the platform without moving what stands on it: every specimen keeps
    // its world pose. Only safe while the stage is hidden.
    const rebase = (angle: number) => {
      const delta = angle - platform.rotation.y;
      const cos = Math.cos(delta);
      const sin = Math.sin(delta);
      items.current.forEach((item) => {
        if (!item) return;
        const { x, z } = item.position;
        item.position.x = cos * x - sin * z;
        item.position.z = sin * x + cos * z;
        item.rotation.y -= delta;
      });
      platform.rotation.y = angle;
    };
    // The set includes the contact shadow's material, whose resting opacity is
    // well under 1: every fade scales each material's own design opacity, kept
    // in userData on first sight, or the shadow bake comes back near black.
    const baseMaterials = () => {
      const materials = new Set<Material>();
      base.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => {
          material.userData.opacity ??= material.opacity;
          materials.add(material);
        });
      });
      return [...materials];
    };
    const baseOpacity = (fraction: number) => (_: number, material: Material) =>
      fraction * (material.userData.opacity as number);
    const setBaseOpacity = (fraction: number) => {
      baseMaterials().forEach((material) => {
        material.transparent = true;
        material.opacity = fraction * (material.userData.opacity as number);
      });
    };
    const applyDetail = (index: number) => {
      amber.current.amount = 0;
      const item = items.current[index];
      if (!item) return;
      selected.current = index;
      // The archive is not mounted: coming back, it opens on this specimen.
      setActive(index);
      motion.current.locked = true;
      platform.rotation.y = -index * step;
      const target = detailTransform(platform.rotation.y, index);
      base.position.y = -3;
      base.scale.setScalar(0.3);
      setBaseOpacity(0);
      labels().forEach((label) => (label.style.opacity = "0"));
      items.current.forEach((entry, itemIndex) => {
        entry?.scale.setScalar(
          itemIndex === index ? models[specimens[index].model].detailScale : 0.001,
        );
      });
      item.position.set(target.x, target.y, target.z);
      item.rotation.y = target.rotation;
      invalidate();
    };
    const applyHome = () => {
      amber.current.amount = 1;
      base.position.y = 0;
      base.scale.setScalar(1);
      setBaseOpacity(1);
      const text = caption();
      if (text) gsap.set(text, { opacity: 1, y: 0 });
      items.current.forEach((item, index) => {
        if (!item) return;
        const target = homeTransform(index);
        item.position.set(target.x, REST_Y, target.z);
        item.rotation.y = target.rotation;
        item.scale.setScalar(1);
      });
      motion.current.locked = false;
      motion.current.angle = platform.rotation.y;
      motion.current.target = platform.rotation.y;
      motion.current.velocity = 0;
      setActive(indexAt(platform.rotation.y));
      invalidate();
    };

    // Each specimen program links on its first draw. Left to the intro's
    // opening frame that is ~700ms of blocked main thread, so the timeline is
    // already half over by the time anything paints. Link in parallel, then
    // spend one throwaway render on the shadow and bokeh depth variants that
    // compileAsync does not reach — both land while the stage is still empty.
    const warm = async () => {
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        // No parallel-compile extension: the warm frame below links instead.
      }
      invalidate();
      await new Promise<void>((resolve) => {
        // R3F renders on the next frame; resume on the one after it landed.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    };

    // The detail idle — slow spin plus the hover flash — starts once the
    // specimen lands, while the page's own entrances keep playing. `complete`
    // only covers the runs that never reach this point.
    const settle = () => {
      if (spinning.current) return;
      spinning.current = true;
      flashes.current[selected.current]?.();
      invalidate();
    };

    // Clears the platform for a detail page: the base sinks and fades, the labels
    // go, and every specimen but `keep` shrinks away. Also tidies up after an
    // interrupted run, which can leave any of them half-way.
    const hideStage = (timeline: gsap.core.Timeline, position: number, keep: number[]) => {
      // Quick exit: detail poses sit lower than the platform surface, so the
      // base must be gone before the kept specimen's glide dips through it.
      timeline.to(base.position, { y: -3, duration: 0.55, ease: "power2.in" }, position);
      timeline.to(
        base.scale,
        { x: 0.3, y: 0.3, z: 0.3, duration: 0.55, ease: "power2.in" },
        position,
      );
      timeline.to(baseMaterials(), { opacity: 0, duration: 0.4, ease: "power2.in" }, position);
      timeline.to(labels(), { opacity: 0, duration: 0.3, ease: "power2.out" }, position);
      items.current.forEach((entry, index) => {
        if (entry && !keep.includes(index)) {
          timeline.to(
            entry.scale,
            { x: 0.001, y: 0.001, z: 0.001, duration: 0.5, ease: "power2.in" },
            position,
          );
        }
      });
    };

    // Off-stage pose for the intro. The platform paints from here, before the
    // page transition plays it in: the caption and titles are the page's own
    // recipes now, coordinated through the shared labels.
    const prepareHome = () => {
      motion.current.locked = true;
      base.position.y = -3;
      base.scale.setScalar(0.3);
      setBaseOpacity(0);
      items.current.forEach((item) => item?.scale.setScalar(0.001));
      if (motion.current.reduced) applyHome();
    };

    const introHome = (timeline: gsap.core.Timeline, position: number) => {
      timeline.to(base.position, { y: 0, duration: 0.9, ease: "power3.out" }, position);
      timeline.to(base.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: "power3.out" }, position);
      timeline.to(
        baseMaterials(),
        { opacity: baseOpacity(1), duration: 0.5, ease: "power2.out" },
        position + 0.1,
      );
      items.current.forEach((item, index) => {
        if (!item) return;
        // Front specimen first, then both neighbours together, ring outward.
        const rank = Math.min(index, specimens.length - index);
        timeline.to(
          item.scale,
          { x: 1, y: 1, z: 1, duration: 0.7, ease: "power3.out" },
          position + 0.45 + rank * 0.12,
        );
      });
      timeline.to(amber.current, { amount: 1, duration: 0.6, ease: "power3.out" }, position + 0.9);
    };

    // Compile shaders and prepare the models, let the loader leave, then
    // release the transition that is waiting on the canvas.
    const warmup = () => {
      warming.current = true;
      void warm()
        .then(dismiss)
        .then(() => {
          // Unmounted, or a navigation took over while we were compiling.
          if (!warming.current) return;
          warming.current = false;
          culling.current = true;
          sceneReady.resolve();
        });
    };

    controller.current = {
      transition(timeline, currentPath, nextPath, position, initial) {
        moving.current = true;
        const nextIndex = specimenIndex(nextPath);
        const currentIndex = specimenIndex(currentPath);
        // First load: there is nothing to move from, only the archive intro.
        // A direct detail load is already in place and contributes nothing;
        // an unknown specimen keeps the stage empty.
        if (initial) {
          if (nextPath === "/" && !motion.current.reduced) {
            introHome(timeline, position);
            timeline.to(
              { progress: 0 },
              { progress: 1, duration: 1.5, onUpdate: invalidate },
              position,
            );
          }
          return;
        }
        motion.current.locked = true;
        spinning.current = false;
        timeline.to(
          amber.current,
          {
            amount: nextPath === "/" ? 1 : 0,
            duration: motion.current.reduced ? 0 : nextPath === "/" ? 0.6 : 0.3,
            ease: nextPath === "/" ? "power3.out" : "power2.in",
            onUpdate: invalidate,
          },
          nextPath === "/" ? position + 0.25 : 0,
        );

        // Into a specimen from anywhere that is not one: the archive, or an
        // unknown specimen's empty stage.
        if (currentIndex < 0 && nextIndex >= 0) {
          const item = items.current[nextIndex];
          if (!item) return;
          selected.current = nextIndex;
          const target = detailTransform(platform.rotation.y, nextIndex);
          const scale = models[specimens[nextIndex].model].detailScale;
          target.rotation = nearestAngle(target.rotation, item.rotation.y);
          hideStage(timeline, position, [nextIndex]);
          timeline.to(
            item.position,
            {
              x: target.x,
              y: target.y,
              z: target.z,
              duration: 0.9,
              ease: "power3.inOut",
            },
            position,
          );
          timeline.to(
            item.rotation,
            { y: target.rotation, duration: 0.9, ease: "power3.inOut" },
            position,
          );
          timeline.to(
            item.scale,
            {
              x: scale,
              y: scale,
              z: scale,
              duration: 0.9,
              ease: "power3.inOut",
            },
            position,
          );
          timeline.call(settle, undefined, position + 0.9);
        } else if (currentIndex >= 0 && nextIndex >= 0) {
          const leaving = items.current[currentIndex];
          const arriving = items.current[nextIndex];
          if (!leaving || !arriving) return;
          // Browsing turns the hidden platform to the new specimen, so the way
          // back to the archive lands on the last one seen.
          rebase(nearestAngle(-nextIndex * step, platform.rotation.y));
          selected.current = nextIndex;
          setActive(nextIndex);
          let offset = nextIndex - currentIndex;
          if (offset > specimens.length / 2) offset -= specimens.length;
          if (offset < -specimens.length / 2) offset += specimens.length;
          // Next slides in from the right, previous from the left.
          const direction = Math.sign(offset);
          const pace = motion.current.reduced ? 0 : 1;
          const scale = models[specimens[nextIndex].model].detailScale;
          const target = detailTransform(platform.rotation.y, nextIndex);
          const entry = detailTransform(platform.rotation.y, nextIndex, direction * 0.45);
          const exit = detailTransform(platform.rotation.y, currentIndex, -direction * 0.45);
          hideStage(timeline, position, [currentIndex, nextIndex]);
          const out = { duration: 0.8 * pace, ease: "power3.inOut" };
          timeline.to(leaving.position, { x: exit.x, y: exit.y, z: exit.z, ...out }, position);
          timeline.to(
            leaving.rotation,
            { y: leaving.rotation.y - direction * 1.1, ...out },
            position,
          );
          timeline.to(
            leaving.scale,
            { x: 0.001, y: 0.001, z: 0.001, duration: 0.7 * pace, ease: "power3.in" },
            position,
          );
          const into = { duration: 0.9 * pace, ease: "power3.out" };
          const arrival = position + 0.2 * pace;
          timeline.fromTo(
            arriving.position,
            { x: entry.x, y: entry.y, z: entry.z },
            // The shared progress tween below stops at 0.9s; the arrival runs past it.
            { x: target.x, y: target.y, z: target.z, ...into, onUpdate: invalidate },
            arrival,
          );
          timeline.fromTo(
            arriving.rotation,
            { y: target.rotation + direction * 1.1 },
            { y: target.rotation, ...into },
            arrival,
          );
          timeline.fromTo(
            arriving.scale,
            { x: 0.001, y: 0.001, z: 0.001 },
            { x: scale, y: scale, z: scale, ...into },
            arrival,
          );
          timeline.call(settle, undefined, arrival + into.duration);
        } else if (nextIndex < 0 && nextPath !== "/") {
          // An unknown specimen: nothing to show, so the stage clears.
          selected.current = -1;
          hideStage(timeline, position, []);
        } else if (nextPath === "/" && currentPath !== "/") {
          // Late entrance: the returning specimen glides in from its low
          // detail pose, so the platform holds back until that pass is over
          // and rises to meet the feet right at the end.
          timeline.to(base.position, { y: 0, duration: 0.55, ease: "power3.out" }, position + 0.35);
          timeline.to(
            base.scale,
            { x: 1, y: 1, z: 1, duration: 0.55, ease: "power3.out" },
            position + 0.35,
          );
          timeline.to(
            baseMaterials(),
            { opacity: baseOpacity(1), duration: 0.4, ease: "power2.out" },
            position + 0.45,
          );
          items.current.forEach((item, index) => {
            if (!item) return;
            const target = homeTransform(index);
            target.rotation = nearestAngle(target.rotation, item.rotation.y);
            timeline.to(
              item.position,
              {
                x: target.x,
                y: REST_Y,
                z: target.z,
                duration: 0.9,
                ease: "power3.inOut",
              },
              position,
            );
            timeline.to(
              item.rotation,
              { y: target.rotation, duration: 0.9, ease: "power3.inOut" },
              position,
            );
            timeline.to(
              item.scale,
              { x: 1, y: 1, z: 1, duration: 0.75, ease: "power2.out" },
              position + 0.15,
            );
          });
        }
        timeline.to(
          { progress: 0 },
          { progress: 1, duration: 0.9, onUpdate: invalidate },
          position,
        );
      },
      complete(nextPath) {
        moving.current = false;
        // Read by tests/matrix.tsx: what the stage settled on, since the canvas
        // offers nothing else to inspect from the DOM.
        gl.domElement.dataset.stage =
          nextPath === "/" ? "archive" : selected.current >= 0 ? "detail" : "empty";
        if (nextPath === "/") applyHome();
        else {
          controller.current?.fit();
          motion.current.locked = true;
          settle();
        }
      },
      fit() {
        const index = selected.current;
        const item = items.current[index];
        if (moving.current || !item || specimenIndex(pathname) !== index) return;
        const target = detailTransform(platform.rotation.y, index);
        item.position.set(target.x, target.y, target.z);
        invalidate();
      },
    };

    if (!initialized.current) {
      initialized.current = true;
      const index = specimenIndex(pathname);
      if (index >= 0) {
        applyDetail(index);
        spinning.current = true;
      } else prepareHome();
      // The off-stage specimens still need the warm-up frame: culling them
      // before their programs link moves the stall onto the way back to the
      // archive, when they scale up again.
      warmup();
    }

    return () => {
      // A warm-up interrupted mid-flight (StrictMode remount) must run again
      // on the next pass, together with the pose it was preparing.
      if (warming.current) {
        warming.current = false;
        culling.current = false;
        initialized.current = false;
      }
      controller.current = null;
    };
  }, [camera, gl, invalidate, motion, pathname, prepared, scene, setActive]);
  // Camera renders first and has already re-projected for the new size.
  useLayoutEffect(() => {
    controller.current?.fit();
  }, [size]);
  usePersistentTransition({
    enterAt: "scene-start",
    enter: (timeline, { current, next, position, initial }) => {
      controller.current?.transition(timeline, current.pathname, next.pathname, position, initial);
    },
    complete: ({ next }) => {
      controller.current?.complete(next.pathname);
    },
  });
  useFrame((_, delta) => {
    // Scaling a specimen to 0.001 hides it but still submits every triangle.
    // Off-stage specimens are four fifths of the geometry on a detail page.
    if (culling.current) {
      items.current.forEach((item) => {
        if (item) item.visible = item.scale.x > 0.01;
      });
    }
    const state = motion.current;
    if (state.locked) {
      state.lean = 0;
      state.leanTarget = 0;
      const item = items.current[selected.current];
      if (spinning.current && item) {
        item.rotation.y += delta * 0.15;
        invalidate();
      }
      return;
    }
    const dt = Math.min(delta, 0.05);
    const idle = performance.now() - state.lastInput;
    if (state.dragging || idle < 60) {
      // Holding the pointer still sends no events, so bleed the sample here or
      // a paused finger would release with whatever speed it arrived at.
      state.velocity *= Math.exp(-dt * 4);
    }
    const settling = snap && !state.dragging && idle > 120;
    if (settling) state.target = landing(state.target, state.velocity);
    // The glide into the snap position damps slower than gesture tracking, so
    // the reframe reads as coming to rest rather than a correction.
    state.angle = state.reduced
      ? state.target
      : MathUtils.damp(state.angle, state.target, settling ? spin.glide : spin.track, dt);
    if (Math.abs(state.angle - state.target) < 0.0001) state.angle = state.target;
    // Continue through the damping and the wheel debounce, then let the GPU rest.
    if (state.angle !== state.target || (snap && !state.dragging && idle <= 120)) {
      invalidate();
    }
    if (lean && !state.reduced) {
      state.lean = MathUtils.damp(state.lean, state.leanTarget, leanTilt.damp, dt);
      if (Math.abs(state.lean - state.leanTarget) < 0.0001) state.lean = state.leanTarget;
      else invalidate();
    }
    if (group.current) group.current.rotation.y = state.angle + state.lean;
    const active = indexAt(state.angle);
    if (active !== previous.current) {
      previous.current = active;
      setActive(active);
    }
  });
  return (
    <>
      <group ref={group}>
        <group ref={stage}>
          <mesh receiveShadow position={[0, -0.15, 0]}>
            <cylinderGeometry args={[6.2, 6.2, 0.3, 128]} />
            <meshPhysicalMaterial
              color="#cbd3d9"
              roughness={0.58}
              metalness={0.08}
              clearcoat={0.12}
              clearcoatRoughness={0.7}
            />
          </mesh>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
            <circleGeometry args={[6.14, 128]} />
            <meshPhysicalMaterial color="#e3e8eb" roughness={0.7} metalness={0.04} />
          </mesh>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.009, 0]}
            // ShaderMaterial ignores material.opacity, so the base fade tweens never
            // reach the grid unless we mirror it into a uniform each frame.
            onBeforeRender={(_renderer, _scene, _camera, _geometry, material) => {
              const shader = material as ShaderMaterial;
              // The bokeh depth pass draws through scene.overrideMaterial, so this
              // also fires with a material that never declared uOpacity.
              if (!shader.uniforms?.uOpacity) return;
              shader.uniforms.uOpacity.value = shader.opacity;
            }}
          >
            <circleGeometry args={[6.12, 128]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              toneMapped={false}
              uniforms={{ uOpacity: { value: 1 } }}
              vertexShader={`
            varying vec2 vGridUv;
            void main() {
              vGridUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
              fragmentShader={`
            varying vec2 vGridUv;
            uniform float uOpacity;
            // Cell = 26px and cross every 4th cell, matching the bg-pattern utility.
            const float CROSS_EVERY = 4.0;
            const float LINE = 0.5 / 26.0;
            const float STROKE = 0.4 / 26.0;
            const float ARM = 8.0 / 26.0;
            float band(float distance, float edge, float softness) {
              return 1.0 - smoothstep(edge - softness, edge + softness, distance);
            }
            void main() {
              vec2 grid = (vGridUv - 0.5) * 22.0;
              vec2 softness = fwidth(grid) * 0.5 + 0.0001;
              vec2 toLine = abs(grid - floor(grid + 0.5));
              float lines = max(
                band(toLine.x, LINE * 0.5, softness.x),
                band(toLine.y, LINE * 0.5, softness.y)
              );
              vec2 toCross = abs(grid - floor(grid / CROSS_EVERY + 0.5) * CROSS_EVERY);
              float mark = max(
                band(toCross.x, STROKE * 0.5, softness.x) *
                  band(toCross.y, ARM, softness.y),
                band(toCross.y, STROKE * 0.5, softness.y) *
                  band(toCross.x, ARM, softness.x)
              );
              float edge = 1.0 - smoothstep(0.43, 0.5, length(vGridUv - 0.5));
              gl_FragColor = vec4(0.18, 0.25, 0.31, max(lines * 0.45, mark * 0.9) * edge * uOpacity);
            }
          `}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <ringGeometry args={[6.14, 6.17, 128]} />
            <meshStandardMaterial color="#f8fbfc" roughness={0.24} metalness={0.22} />
          </mesh>
          {/* Continuous bake: a single frame lands during warm-up, while every
              specimen is still scaled to 0.001, and stays empty forever. Under
              frameloop="demand" this only re-renders on already-invalidated frames. */}
          {/* far is short on purpose: only feet and lower legs register, so
              bodies, tails and necks overhead cannot stamp their whole
              silhouette onto the floor — the directional light owns those. */}
          <ContactShadows
            position={[0, 0.014, 0]}
            opacity={0.34}
            scale={12.2}
            blur={2.2}
            far={0.8}
            resolution={512}
            frames={Infinity}
          />
        </group>
        {specimens.map((specimen, index) => (
          <Specimen
            key={specimen.slug}
            index={index}
            model={prepared[specimen.model]}
            setRef={(node) => {
              items.current[index] = node;
            }}
            setFlash={(flashIndex, flash) => {
              flashes.current[flashIndex] = flash;
            }}
            onSelect={onSelect}
            showLabel={pathname === "/"}
          />
        ))}
      </group>
      <Amber reveal={amber} />
    </>
  );
}

// Canvas mounts its `fallback` inside the <canvas> element either way, and a
// failed context rejects outside React, so the check happens before mounting.
// The probe context is released at once.
function hasWebGL() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export function Scene() {
  const [webgl] = useState(hasWebGL);
  const stage = useRef<HTMLCanvasElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { motion } = useArchive();
  const select = useCallback(
    (index: number) => {
      if (pathname !== "/" || performance.now() - motion.current.lastDrag < 220) return;
      navigate(`/specimens/${specimens[index].slug}`);
    },
    [motion, navigate, pathname],
  );

  return (
    <div
      className={
        pathname === "/"
          ? "fixed inset-0 z-20"
          : "absolute inset-x-0 top-0 z-20 h-[max(42rem,100svh)] lg:fixed lg:inset-0 lg:h-auto"
      }
      aria-label="Five dinosaur specimens on a rotating laboratory platform"
      role="img"
    >
      {webgl ? (
        <Boundary>
          <Canvas
            ref={stage}
            frameloop="demand"
            shadows={{ type: PCFShadowMap }}
            dpr={[1, 1.5]}
            camera={{ near: 0.1, far: 100 }}
            gl={{ antialias: true, premultipliedAlpha: false }}
            // Hidden until the loader dismisses; WebGL still draws the warm-up frame.
            onCreated={({ gl }) => {
              if (!sceneReady.settled) gl.domElement.style.opacity = "0";
            }}
            fallback={
              <p className="p-8 text-center text-xs">
                3D display unavailable. Please use a WebGL-enabled browser.
              </p>
            }
          >
            <Camera />
            <EffectComposer multisampling={2}>
              {/* depth is linear over near–far; sharp from the camera to just past the amber */}
              <Bokeh focus={0.07} dof={0.07} aperture={0.15} maxBlur={0.005} />
              <Straight />
              {/* the composer switches off the renderer's tone mapping */}
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
            <ambientLight intensity={0.55} />
            <hemisphereLight args={["#f8fcff", "#5d7180", 1.35]} />
            <directionalLight
              position={[-7, 11, 8]}
              intensity={3.8}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-8}
              shadow-camera-right={8}
              shadow-camera-top={8}
              shadow-camera-bottom={-8}
              shadow-normalBias={0.04}
              shadow-radius={3}
            />
            <directionalLight position={[7, 5, 6]} intensity={1.25} color="#c7dbe7" />
            <directionalLight position={[0, 6, -8]} intensity={2.1} color="#eaf7ff" />
            <Suspense fallback={null}>
              <Platform pathname={pathname} onSelect={select} />
            </Suspense>
          </Canvas>
          <Loader stage={stage} />
        </Boundary>
      ) : (
        <Offline>
          <p>3D display unavailable</p>
          <p className="mt-2">Please use a WebGL-enabled browser.</p>
        </Offline>
      )}
    </div>
  );
}
