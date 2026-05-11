"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated starfield + slowly drifting nebula points behind the page.
 * Pure Three.js with a single canvas — no heavyweight wrappers.
 */
export default function Starfield() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02010a, 0.0009);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      4000,
    );
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const buildStarLayer = (count: number, size: number, spread: number, hue: number) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const palette = new THREE.Color();
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
        const sat = Math.random() * 0.4;
        const light = 0.6 + Math.random() * 0.4;
        palette.setHSL(hue + (Math.random() - 0.5) * 0.1, sat, light);
        colors[i * 3 + 0] = palette.r;
        colors[i * 3 + 1] = palette.g;
        colors[i * 3 + 2] = palette.b;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(geom, mat);
    };

    const farStars = buildStarLayer(2200, 1.0, 2800, 0.6);
    const midStars = buildStarLayer(900, 1.8, 1800, 0.7);
    const nearStars = buildStarLayer(300, 3.0, 1200, 0.75);
    scene.add(farStars, midStars, nearStars);

    let mouseX = 0, mouseY = 0;
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("mousemove", handleMouse);

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      farStars.rotation.y = t * 0.015;
      midStars.rotation.y = t * 0.03;
      nearStars.rotation.y = t * 0.05;
      farStars.rotation.x = Math.sin(t * 0.05) * 0.05;
      camera.position.x += (mouseX * 80 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 80 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", onResize);
      [farStars, midStars, nearStars].forEach((p) => {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
