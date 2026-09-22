import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Interactive3DScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 16, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. High-end Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 0.8);
    scene.add(ambientLight);

    // Key Light (Warm titanium sun)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    keyLight.position.set(25, 45, 25);
    scene.add(keyLight);

    // Rim Light (Sapphire blue edge glow)
    const rimLight = new THREE.DirectionalLight(0x6366f1, 2.0);
    rimLight.position.set(-25, 20, -15);
    scene.add(rimLight);

    // Industrial Furnace / Laser Accent Light (Emerald & Copper)
    const amberAccent = new THREE.PointLight(0xf59e0b, 3.2, 50);
    amberAccent.position.set(-12, 8, 12);
    scene.add(amberAccent);

    // Interactive Cursor Light
    const cursorLight = new THREE.PointLight(0x818cf8, 2.8, 45);
    scene.add(cursorLight);

    // 3. Central Architectural Model: High-Tech Silo Facility
    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    // Materials: Brushed Titanium, Deep Slate, Polished Copper, Frosted Architectural Glass
    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate titanium
      roughness: 0.28,
      metalness: 0.85
    });

    const brushedAlloy = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.9
    });

    const copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Rich industrial copper
      roughness: 0.25,
      metalness: 0.8
    });

    const indigoAccentMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.3,
      metalness: 0.6
    });

    const frostedGlass = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.75,
      thickness: 1.5,
      transparent: true,
      opacity: 0.55
    });

    // 3 Silos with cones and support rings
    const siloGeo = new THREE.CylinderGeometry(2.4, 2.4, 12, 40);
    const siloConeGeo = new THREE.ConeGeometry(2.5, 2.2, 40);
    const ringGeo = new THREE.TorusGeometry(2.55, 0.1, 16, 50);

    const silos = [
      { x: -6, z: -3.5, mat: titaniumMaterial, accent: copperMaterial },
      { x: 0, z: -5.5, mat: brushedAlloy, accent: indigoAccentMat },
      { x: 6, z: -3.5, mat: titaniumMaterial, accent: copperMaterial }
    ];

    silos.forEach((s) => {
      // Cylinder body
      const mesh = new THREE.Mesh(siloGeo, s.mat);
      mesh.position.set(s.x, 4.5, s.z);
      clusterGroup.add(mesh);

      // Top roof cone
      const cone = new THREE.Mesh(siloConeGeo, s.accent);
      cone.position.set(s.x, 11.5, s.z);
      clusterGroup.add(cone);

      // Industrial reinforcing rings
      const ring1 = new THREE.Mesh(ringGeo, s.accent);
      ring1.position.set(s.x, 3, s.z);
      ring1.rotation.x = Math.PI / 2;
      clusterGroup.add(ring1);

      const ring2 = new THREE.Mesh(ringGeo, s.accent);
      ring2.position.set(s.x, 7, s.z);
      ring2.rotation.x = Math.PI / 2;
      clusterGroup.add(ring2);
    });

    // Modular geometric production modules
    const modules = [
      { geo: new THREE.BoxGeometry(8, 3.5, 6), pos: [-1, -1.2, 3], mat: brushedAlloy },
      { geo: new THREE.BoxGeometry(5, 6, 4.5), pos: [7, 0.5, 4], mat: frostedGlass },
      { geo: new THREE.BoxGeometry(5.5, 4.5, 4), pos: [-7.5, 0, 3], mat: titaniumMaterial },
      { geo: new THREE.BoxGeometry(3.2, 9, 3.2), pos: [-3, 2.5, 7.5], mat: indigoAccentMat },
      { geo: new THREE.BoxGeometry(4, 2, 4), pos: [3, -1.8, 6], mat: copperMaterial }
    ];

    modules.forEach((m) => {
      const mesh = new THREE.Mesh(m.geo, m.mat);
      mesh.position.set(m.pos[0], m.pos[1], m.pos[2]);
      clusterGroup.add(mesh);
    });

    // 4. Elegant Cybernetic Ground Grid
    const gridHelper = new THREE.GridHelper(60, 30, 0x6366f1, 0x334155);
    gridHelper.position.y = -3.2;
    scene.add(gridHelper);

    // 5. Floating Amber & Cyan Micro-Particles
    const particleCount = 380;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVel = [];

    const color1 = new THREE.Color(0x818cf8); // Indigo
    const color2 = new THREE.Color(0xf59e0b); // Amber

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 65;
      particlePositions[i3 + 1] = Math.random() * 38 - 6;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 55;

      const mixedColor = Math.random() > 0.4 ? color1 : color2;
      particleColors[i3] = mixedColor.r;
      particleColors[i3 + 1] = mixedColor.g;
      particleColors[i3 + 2] = mixedColor.b;

      particleVel.push({
        y: Math.random() * 0.018 + 0.005,
        x: (Math.random() - 0.5) * 0.008
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Smooth Mouse Interaction Tracking
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      mouseX = x * 2;
      mouseY = y * 2;

      targetRotationY = mouseX * 0.65;
      targetRotationX = mouseY * 0.35;

      cursorLight.position.set(mouseX * 18, -mouseY * 14 + 12, 22);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth cluster rotation with gentle idle float
      clusterGroup.rotation.y += (targetRotationY - clusterGroup.rotation.y) * 0.045 + 0.0012;
      clusterGroup.rotation.x += (targetRotationX - clusterGroup.rotation.x) * 0.045;
      clusterGroup.position.y = Math.sin(elapsedTime * 1.1) * 0.4;

      // Particle floating loop
      const positions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += particleVel[i].y;
        positions[i3] += particleVel[i].x;

        if (positions[i3 + 1] > 32) {
          positions[i3 + 1] = -6;
          positions[i3] = (Math.random() - 0.5) * 55;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Camera soft parallax
      camera.position.x += (mouseX * 3.5 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 2.5 + 16 - camera.position.y) * 0.025;
      camera.lookAt(0, 4.5, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[550px] overflow-hidden flex flex-col justify-between p-8 sm:p-12 select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair z-0" />

      {/* Top Branding Overlay */}
      <div className="relative z-10 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-semibold shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          ERP Цемент • Промышленная редакция
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-md leading-tight">
          Автоматизация цементного завода и логистики
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
          Мониторинг силосов, биржевых тикетов, весового контроля и дебиторской задолженности в едином окне
        </p>
      </div>

      {/* Interactive Hint & Metrics Overlay */}
      <div className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Силосы и квоты</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Контроль остатков</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Защита от дефицита</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Касса и ТТН</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Мгновенная печать</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Аудит всех проводок</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>Интерактивная 3D-модель комплекса реагирует на курсор мыши</span>
        </div>
      </div>
    </div>
  );
}
