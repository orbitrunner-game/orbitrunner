"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Game3DProps {
  onProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
}

export default function Game3D({ onProgress, onLoadComplete }: Game3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState("menu");
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(5);
  const [lives, setLives] = useState(3);

  const stateRef = useRef<any>({
    lanes: 3,
    lane: 1,
    laneTarget: 1,
    obstacles: [] as THREE.Group[],
    bullets: [] as THREE.Mesh[],
    pickups: [] as THREE.Mesh[],
    clouds: [] as THREE.Mesh[],
    bridges: [] as THREE.Group[],
    speed: 0.38,
    playerVelY: 0,
    gravity: -0.0035,
    onGround: true,
    jumpCount: 0,
    isPlaying: false,
    ammo: 5,
    bounceCount: 0,
    maxBounces: 2,
    bounceDamping: 0.4,
    lastSpawn: 0,
    lastPickup: 0,
    lastCloudSpawn: 0,
    lastBridgeSpawn: 0,
  });

  useEffect(() => {
    stateRef.current.ammo = ammo;
  }, [ammo]);

  useEffect(() => {
    stateRef.current.speed = 0.18 + Math.min(0.12, score * 0.0001);
  }, [score]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    scene.fog = new THREE.FogExp2(0x020208, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 5, -14);
    camera.lookAt(0, 1, 15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    if (onProgress) onProgress(30);

    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 800;
    const starPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 300;
      starPositions[i + 1] = Math.random() * 80 + 10;
      starPositions[i + 2] = Math.random() * 200;
    }

    starsGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3),
    );
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    const light = new THREE.DirectionalLight(0xff00ff, 1.2);
    light.position.set(15, 25, -10);
    scene.add(light);

    const light2 = new THREE.DirectionalLight(0x00ffff, 1.2);
    light2.position.set(-15, 25, -10);
    scene.add(light2);

    const amb = new THREE.AmbientLight(0x1a1a3a);
    scene.add(amb);

    if (onProgress) onProgress(60);

    const floorGeo = new THREE.PlaneGeometry(120, 400, 30, 100);
    const posAttr = floorGeo.attributes.position;
    const colors = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      if (Math.abs(x) > 6) {
        const noise =
          Math.sin(x * 0.3) * Math.cos(z * 0.2) * 0.8 +
          Math.sin(z * 0.05) * 1.5;
        posAttr.setY(i, noise);
        colors.push(0.01, 0.01, 0.04);
      } else {
        colors.push(0.04, 0.04, 0.08);
      }
    }
    floorGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    scene.add(floor);

    const laneWidth = 4;
    for (let i = -1; i <= 1; i++) {
      const lineGeo = new THREE.PlaneGeometry(0.15, 400);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(i * laneWidth, -0.93, 100);
      scene.add(line);
    }

    const gridGeo = new THREE.PlaneGeometry(12, 400, 6, 100);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const roadGrid = new THREE.Mesh(gridGeo, gridMat);
    roadGrid.rotation.x = -Math.PI / 2;
    roadGrid.position.set(0, -0.92, 100);
    scene.add(roadGrid);

    const fenceMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    function createFenceLine(xPos: number) {
      const fenceGroup = new THREE.Group();
      const numPosts = 40;
      const spacing = 10;

      for (let i = 0; i < numPosts; i++) {
        const zPos = i * spacing;

        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.5, 0.1),
          fenceMat,
        );
        post.position.set(xPos, -0.1, zPos);
        fenceGroup.add(post);

        if (i < numPosts - 1) {
          const rail1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, spacing),
            fenceMat,
          );
          rail1.position.set(xPos, 0.4, zPos + spacing / 2);
          fenceGroup.add(rail1);

          const rail2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, spacing),
            fenceMat,
          );
          rail2.position.set(xPos, -0.2, zPos + spacing / 2);
          fenceGroup.add(rail2);
        }
      }
      return fenceGroup;
    }

    const leftFence = createFenceLine(-6);
    const rightFence = createFenceLine(6);
    scene.add(leftFence);
    scene.add(rightFence);

    const player = new THREE.Group();
    player.position.set((stateRef.current.lane - 1) * laneWidth, 0, 0);
    scene.add(player);
    stateRef.current.player = player;

    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.1,
      metalness: 0.8,
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      roughness: 0.3,
    });

    const coreBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      ballMat,
    );
    coreBall.position.y = 0.8;
    player.add(coreBall);

    const ringGeo = new THREE.TorusGeometry(1.1, 0.1, 6, 24);
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.position.y = 0.8;
    orbitRing.rotation.x = Math.PI / 3;
    player.add(orbitRing);

    if (onProgress) onProgress(90);

    function spawnCloud() {
      const cloudGroup = new THREE.Group() as any;
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        roughness: 0.5,
        metalness: 0.5,
        flatShading: true,
      });

      const numBlobs = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numBlobs; i++) {
        const radius = 2.0 + Math.random() * 3;
        const blobGeo = new THREE.SphereGeometry(radius, 6, 6);
        const blob = new THREE.Mesh(blobGeo, cloudMat);
        blob.position.set(
          (i - numBlobs / 2) * 2.0,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
        );
        cloudGroup.add(blob);
      }

      const posX = (Math.random() - 0.5) * 120;
      const posY = 22 + Math.random() * 10;
      cloudGroup.position.set(posX, posY, 180);
      cloudGroup.userData = { speedFactor: 0.4 + Math.random() * 0.6 };

      scene.add(cloudGroup);
      stateRef.current.clouds.push(cloudGroup);
    }

    function spawnBridge() {
      const bridgeGroup = new THREE.Group();
      const neonPlankMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x111122,
        metalness: 0.9,
      });

      for (let i = 0; i < 7; i++) {
        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(14, 0.15, 0.6),
          neonPlankMat,
        );
        plank.position.set(0, -0.85, (i - 3) * 1.4);
        bridgeGroup.add(plank);
      }

      const leftSide = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 10),
        frameMat,
      );
      leftSide.position.set(-6.5, -0.75, 0);
      bridgeGroup.add(leftSide);

      const rightSide = leftSide.clone();
      rightSide.position.x = 6.5;
      bridgeGroup.add(rightSide);

      bridgeGroup.position.set(0, 0, 140);
      scene.add(bridgeGroup);
      stateRef.current.bridges.push(bridgeGroup);
    }

    function spawnObstacle() {
      const lane = Math.floor(Math.random() * stateRef.current.lanes);
      const obstacleGroup = new THREE.Group() as any;

      const isSpiderType = Math.random() < 0.5;

      if (!isSpiderType) {
        const monsterMat = new THREE.MeshStandardMaterial({
          color: 0x9400d3,
          roughness: 0.4,
        });
        const eyeMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.2,
        });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

        const body = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 10, 10),
          monsterMat,
        );
        body.position.y = 1.0;
        body.scale.set(1, 1.1, 1);
        obstacleGroup.add(body);

        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 8),
          eyeMat,
        );
        eye.position.set(0, 1.2, -0.85);
        obstacleGroup.add(eye);

        const pupil = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 8),
          pupilMat,
        );
        pupil.position.set(0, 1.2, -1.15);
        obstacleGroup.add(pupil);

        const hornGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.5, 1.9, 0);
        leftHorn.rotation.z = 0.3;
        obstacleGroup.add(leftHorn);

        const rightHorn = leftHorn.clone();
        rightHorn.position.x = 0.5;
        rightHorn.rotation.z = -0.3;
        obstacleGroup.add(rightHorn);

        for (let i = 0; i < 4; i++) {
          const tentacleGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 4);
          const tentacle = new THREE.Mesh(tentacleGeo, monsterMat);
          tentacle.position.set((i - 1.5) * 0.4, 0.2, 0);
          obstacleGroup.add(tentacle);
        }

        obstacleGroup.position.set((lane - 1) * laneWidth, 0, 80);
        obstacleGroup.userData = { type: "walker" };
      } else {
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          metalness: 0.9,
          roughness: 0.1,
          flatShading: true,
        });
        const legMat = new THREE.MeshStandardMaterial({
          color: 0xff0055,
          metalness: 0.5,
          roughness: 0.5,
        });

        const body = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.8, 0),
          coreMat,
        );
        body.position.y = 1.1;
        obstacleGroup.add(body);

        const coreGlow = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        coreGlow.position.set(0, 1.1, -0.6);
        obstacleGroup.add(coreGlow);

        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 4);

        const legLF = new THREE.Mesh(legGeo, legMat);
        legLF.position.set(-0.9, 0.5, -0.4);
        legLF.rotation.z = 0.5;
        obstacleGroup.add(legLF);

        const legLB = new THREE.Mesh(legGeo, legMat);
        legLB.position.set(-0.9, 0.5, 0.4);
        legLB.rotation.z = 0.5;
        obstacleGroup.add(legLB);

        const legRF = new THREE.Mesh(legGeo, legMat);
        legRF.position.set(0.9, 0.5, -0.4);
        legRF.rotation.z = -0.5;
        obstacleGroup.add(legRF);

        const legRB = new THREE.Mesh(legGeo, legMat);
        legRB.position.set(0.9, 0.5, 0.4);
        legRB.rotation.z = -0.5;
        obstacleGroup.add(legRB);

        obstacleGroup.position.set((lane - 1) * laneWidth, 0, 80);
        obstacleGroup.userData = { type: "spider" };
      }

      scene.add(obstacleGroup);
      stateRef.current.obstacles.push(obstacleGroup);
    }

    function spawnPickup() {
      const lane = Math.floor(Math.random() * stateRef.current.lanes);
      const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.6, 8);
      const isAmmo = Math.random() < 0.6;
      const mat = new THREE.MeshStandardMaterial({
        color: isAmmo ? 0xf59e0b : 0x60a5fa,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2;
      m.position.set((lane - 1) * laneWidth, 0.5, 90);
      scene.add(m);
      (m as any).type = isAmmo ? "ammo" : "item";
      stateRef.current.pickups.push(m);
    }

    function fireBullet() {
      if (stateRef.current.ammo > 0) {
        const bgeo = new THREE.SphereGeometry(0.25, 6, 6);
        const bmat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const b = new THREE.Mesh(bgeo, bmat);
        b.position.set(
          player.position.x,
          player.position.y + 0.8,
          player.position.z + 1,
        );
        scene.add(b);
        stateRef.current.bullets.push(b);
        setAmmo((a) => Math.max(0, a - 1));
      }
    }
    stateRef.current.fireBullet = fireBullet;

    function jump() {
      if (stateRef.current.onGround) {
        stateRef.current.playerVelY = 1;
        stateRef.current.onGround = false;
        stateRef.current.bounceCount = 0;
        stateRef.current.jumpCount = 1;
      } else if (stateRef.current.jumpCount === 1) {
        stateRef.current.playerVelY = 1;
        stateRef.current.jumpCount = 2;

        if (orbitRing) {
          orbitRing.scale.set(1.6, 1.6, 1.6);
        }
      }
    }
    stateRef.current.jump = jump;

    if (onProgress) onProgress(100);
    if (onLoadComplete) onLoadComplete();

    let last = performance.now();
    let raf = 0;

    function loop(now: number) {
      const dt = now - last;
      last = now;

      if (stateRef.current.isPlaying) {
        stateRef.current.lastSpawn += dt;
        stateRef.current.lastPickup += dt;
        stateRef.current.lastCloudSpawn += dt;
        stateRef.current.lastBridgeSpawn += dt;

        if (stateRef.current.lastSpawn > 1400) {
          spawnObstacle();
          stateRef.current.lastSpawn = 0;
        }
        if (stateRef.current.lastPickup > 2000) {
          spawnPickup();
          stateRef.current.lastPickup = 0;
        }
        if (stateRef.current.lastCloudSpawn > 1500) {
          spawnCloud();
          stateRef.current.lastCloudSpawn = 0;
        }
        if (stateRef.current.lastBridgeSpawn > 5000) {
          spawnBridge();
          stateRef.current.lastBridgeSpawn = 0;
        }

        if (orbitRing && orbitRing.scale.x > 1.0) {
          orbitRing.scale.x -= 0.002 * dt;
          orbitRing.scale.y -= 0.002 * dt;
          orbitRing.scale.z -= 0.002 * dt;
        }

        orbitRing.rotation.z += 0.005 * dt;
        orbitRing.rotation.y += 0.002 * dt;

        const fenceMove = stateRef.current.speed * dt * 0.1;
        leftFence.children.forEach((obj) => {
          obj.position.z -= fenceMove;
          if (obj.position.z < -20) obj.position.z += 400;
        });
        rightFence.children.forEach((obj) => {
          obj.position.z -= fenceMove;
          if (obj.position.z < -20) obj.position.z += 400;
        });

        const pPositions = starsGeo.attributes.position.array as Float32Array;
        for (let i = 2; i < pPositions.length; i += 3) {
          pPositions[i] -= stateRef.current.speed * dt * 0.02;
          if (pPositions[i] < -20) {
            pPositions[i] += 200;
          }
        }
        starsGeo.attributes.position.needsUpdate = true;

        for (let i = stateRef.current.clouds.length - 1; i >= 0; i--) {
          const cloud = stateRef.current.clouds[i];
          cloud.position.z -=
            stateRef.current.speed * dt * 0.05 * cloud.userData.speedFactor;
          if (cloud.position.z < -30) {
            scene.remove(cloud);
            stateRef.current.clouds.splice(i, 1);
          }
        }

        for (let i = stateRef.current.bridges.length - 1; i >= 0; i--) {
          const bridge = stateRef.current.bridges[i];
          bridge.position.z -= stateRef.current.speed * dt * 0.1;
          if (bridge.position.z < -20) {
            scene.remove(bridge);
            stateRef.current.bridges.splice(i, 1);
          }
        }

        for (let i = stateRef.current.obstacles.length - 1; i >= 0; i--) {
          const ob = stateRef.current.obstacles[i];
          ob.position.z -= stateRef.current.speed * dt * 0.1;

          if (ob.userData.type === "walker") {
            ob.children.forEach((child: any, index: number) => {
              if (index >= 5) {
                child.rotation.x = Math.sin(now * 0.022 + index) * 0.5;
              }
            });
            ob.children[0].position.y =
              1.0 + Math.abs(Math.sin(now * 0.04)) * 0.15;
          } else if (ob.userData.type === "spider") {
            const legSpeed = now * 0.035;
            ob.children[2].rotation.x = Math.sin(legSpeed) * 0.4;
            ob.children[5].rotation.x = Math.sin(legSpeed) * 0.4;
            ob.children[3].rotation.x = -Math.sin(legSpeed) * 0.4;
            ob.children[4].rotation.x = -Math.sin(legSpeed) * 0.4;
            ob.children[0].rotation.y = Math.cos(now * 0.02) * 0.1;
          }

          if (ob.position.z < -10) {
            scene.remove(ob);
            stateRef.current.obstacles.splice(i, 1);
            setScore((s) => s + 5);
          }
        }

        for (let i = stateRef.current.pickups.length - 1; i >= 0; i--) {
          const p = stateRef.current.pickups[i];
          p.position.z -= stateRef.current.speed * dt * 0.1;
          p.rotation.z += 0.005 * dt;
          if (p.position.z < -10) {
            scene.remove(p);
            stateRef.current.pickups.splice(i, 1);
          }
          if (
            Math.abs(p.position.z - player.position.z) < 1.3 &&
            Math.abs(p.position.x - player.position.x) < 1.3
          ) {
            if ((p as any).type === "ammo") {
              setAmmo((a) => a + 3);
            } else {
              setScore((s) => s + 50);
            }
            scene.remove(p);
            stateRef.current.pickups.splice(i, 1);
          }
        }

        for (let i = stateRef.current.bullets.length - 1; i >= 0; i--) {
          const b = stateRef.current.bullets[i];
          b.position.z += 0.7 * dt * 0.06;
          if (b.position.z > 120) {
            scene.remove(b);
            stateRef.current.bullets.splice(i, 1);
            continue;
          }
          for (let j = stateRef.current.obstacles.length - 1; j >= 0; j--) {
            const ob = stateRef.current.obstacles[j];
            const checkY = 1.0;
            if (
              Math.abs(b.position.z - ob.position.z) < 1.5 &&
              Math.abs(b.position.x - ob.position.x) < 1.3 &&
              Math.abs(b.position.y - (ob.position.y + checkY)) < 1.5
            ) {
              scene.remove(ob);
              scene.remove(b);
              stateRef.current.obstacles.splice(j, 1);
              stateRef.current.bullets.splice(i, 1);
              setScore((s) => s + 20);
              break;
            }
          }
        }
        stateRef.current.playerVelY += stateRef.current.gravity * dt;
        player.position.y += stateRef.current.playerVelY * dt * 0.06;

        if (player.position.y <= 0) {
          player.position.y = 0;
          stateRef.current.jumpCount = 0;

          if (stateRef.current.bounceCount < stateRef.current.maxBounces) {
            stateRef.current.playerVelY =
              -stateRef.current.playerVelY * stateRef.current.bounceDamping;
            stateRef.current.bounceCount++;

            if (Math.abs(stateRef.current.playerVelY) < 0.1) {
              stateRef.current.playerVelY = 0;
              stateRef.current.onGround = true;
            }
          } else {
            stateRef.current.playerVelY = 0;
            stateRef.current.onGround = true;
          }

          coreBall.rotation.x -= stateRef.current.speed * dt * 0.08;
        } else {
          stateRef.current.onGround = false;
          coreBall.rotation.x -= stateRef.current.speed * dt * 0.04;
        }

        if (stateRef.current.lane !== stateRef.current.laneTarget) {
          const targetX = (stateRef.current.laneTarget - 1) * laneWidth;
          const dx = targetX - player.position.x;
          player.position.x += dx * Math.min(1, dt * 0.012);
          if (Math.abs(dx) < 0.05)
            stateRef.current.lane = Math.round(stateRef.current.laneTarget);
        }

        for (let i = stateRef.current.obstacles.length - 1; i >= 0; i--) {
          const ob = stateRef.current.obstacles[i];
          const checkY = 1.0;
          if (
            Math.abs(ob.position.z - player.position.z) < 1.2 &&
            Math.abs(ob.position.x - player.position.x) < 1.2 &&
            player.position.y < ob.position.y + checkY + 0.6
          ) {
            scene.remove(ob);
            stateRef.current.obstacles.splice(i, 1);
            setLives((l) => {
              const nextLives = l - 1;
              if (nextLives <= 0) {
                setState("gameover");
                stateRef.current.isPlaying = false;
              }
              return nextLives;
            });
          }
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    function onResize() {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    function onKey(e: KeyboardEvent) {
      if (!stateRef.current.isPlaying) return;

      if (e.key === "d" || e.key === "D") {
        stateRef.current.laneTarget = Math.max(
          0,
          stateRef.current.laneTarget - 1,
        );
      }
      if (e.key === "A" || e.key === "a") {
        stateRef.current.laneTarget = Math.min(
          stateRef.current.lanes - 1,
          stateRef.current.laneTarget + 1,
        );
      }
      if (e.key === " ") {
        e.preventDefault();
        stateRef.current.jump();
      }
    }

    function onMouseDown(e: MouseEvent) {
      if (!stateRef.current.isPlaying) return;
      if (e.button === 2) {
        stateRef.current.fireBullet();
      }
    }

    function onContextMenu(e: MouseEvent) {
      if (stateRef.current.isPlaying) {
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("contextmenu", onContextMenu);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("contextmenu", onContextMenu);
      renderer.dispose();
      scene.clear();
      container.innerHTML = "";
    };
  }, [onProgress, onLoadComplete]);

  const requestFullScreen = () => {
    if (rootRef.current) {
      if (rootRef.current.requestFullscreen) {
        rootRef.current.requestFullscreen().catch((err) => {
          console.error("Gagal mengaktifkan Full Screen:", err);
        });
      } else if ((rootRef.current as any).webkitRequestFullscreen) {
        (rootRef.current as any).webkitRequestFullscreen();
      } else if ((rootRef.current as any).msRequestFullscreen) {
        (rootRef.current as any).msRequestFullscreen();
      }
    }
  };

  function start() {
    requestFullScreen();

    stateRef.current.obstacles.forEach((o: any) => o.parent?.remove(o));
    stateRef.current.bullets.forEach((b: any) => b.parent?.remove(b));
    stateRef.current.pickups.forEach((p: any) => p.parent?.remove(p));
    stateRef.current.clouds.forEach((c: any) => c.parent?.remove(c));
    stateRef.current.bridges.forEach((br: any) => br.parent?.remove(br));

    stateRef.current.obstacles = [];
    stateRef.current.bullets = [];
    stateRef.current.pickups = [];
    stateRef.current.clouds = [];
    stateRef.current.bridges = [];
    stateRef.current.lastSpawn = 0;
    stateRef.current.lastPickup = 0;
    stateRef.current.lastCloudSpawn = 0;
    stateRef.current.lastBridgeSpawn = 0;
    stateRef.current.lane = 1;
    stateRef.current.laneTarget = 1;
    stateRef.current.playerVelY = 0;
    stateRef.current.bounceCount = 0;
    stateRef.current.jumpCount = 0;
    stateRef.current.speed = 0.18;

    if (stateRef.current.player) {
      stateRef.current.player.position.set(0, 0, 0);
    }

    setScore(0);
    setAmmo(5);
    setLives(3);
    setState("playing");
    stateRef.current.isPlaying = true;
  }

  function handlePauseToggle() {
    if (state === "playing") {
      setState("paused");
      stateRef.current.isPlaying = false;
    } else if (state === "paused") {
      setState("playing");
      stateRef.current.isPlaying = true;
    }
  }

  const moveRight = () => {
    if (stateRef.current.isPlaying)
      stateRef.current.laneTarget = Math.max(
        0,
        stateRef.current.laneTarget - 1,
      );
  };

  const moveLeft = () => {
    if (stateRef.current.isPlaying)
      stateRef.current.laneTarget = Math.min(
        stateRef.current.lanes - 1,
        stateRef.current.laneTarget + 1,
      );
  };

  const triggerJump = () => {
    if (stateRef.current.isPlaying) stateRef.current.jump();
  };
  const triggerShoot = () => {
    if (stateRef.current.isPlaying) stateRef.current.fireBullet();
  };

  return (
    <div
      ref={rootRef}
      className="game-root"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#020208",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div
        className="hud"
        style={{
          position: "absolute",
          left: "clamp(15px, 4vw, 25px)",
          top: "clamp(15px, 6vw, 30px)",
          color: "#00ffff",
          zIndex: 10,
          fontFamily: "monospace",
          fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
          textShadow: "0 0 5px #00ffff",
          pointerEvents: "none",
        }}>
        <div style={{ fontWeight: "bold" }}>Score: {score}</div>
        <div>Ammo: {ammo}</div>
        <div>Lives: {"❤️".repeat(Math.max(0, lives))}</div>
      </div>

      {state === "playing" && (
        <button
          onClick={handlePauseToggle}
          style={{
            position: "absolute",
            right: "clamp(15px, 4vw, 25px)",
            top: "clamp(15px, 6vw, 30px)",
            zIndex: 10,
            padding: "8px 16px",
            background: "rgba(255,0,255,0.2)",
            backdropFilter: "blur(5px)",
            border: "1px solid #ff00ff",
            color: "#ff00ff",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "clamp(0.85rem, 2.2vw, 1rem)",
            textShadow: "0 0 5px #ff00ff",
            boxShadow: "0 0 10px #ff00ff",
            WebkitTapHighlightColor: "transparent",
          }}>
          Pause
        </button>
      )}

      {state === "playing" && (
        <div
          className="mobile-controls"
          style={{
            position: "absolute",
            bottom: "clamp(20px, 6vw, 40px)",
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            padding: "0 clamp(20px, 5vw, 40px)",
            boxSizing: "border-box",
            zIndex: 15,
            pointerEvents: "none",
          }}>
          <div
            style={{
              display: "flex",
              gap: "clamp(10px, 3vw, 20px)",
              pointerEvents: "auto",
            }}>
            <button
              onClick={moveLeft}
              style={{
                ...mobileBtnStyle,
                borderColor: "#00ffff",
                color: "#00ffff",
                boxShadow: "0 0 10px #00ffff",
              }}>
              ◀
            </button>
            <button
              onClick={moveRight}
              style={{
                ...mobileBtnStyle,
                borderColor: "#00ffff",
                color: "#00ffff",
                boxShadow: "0 0 10px #00ffff",
              }}>
              ▶
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "clamp(10px, 3vw, 20px)",
              pointerEvents: "auto",
            }}>
            <button
              onClick={triggerJump}
              style={{
                ...mobileBtnStyle,
                background: "rgba(0, 240, 255, 0.25)",
                borderColor: "#00f0ff",
                color: "#00f0ff",
                boxShadow: "0 0 10px #00f0ff",
              }}>
              JUMP
            </button>
            <button
              onClick={triggerShoot}
              style={{
                ...mobileBtnStyle,
                background: "rgba(255, 0, 255, 0.25)",
                borderColor: "#ff00ff",
                color: "#ff00ff",
                boxShadow: "0 0 10px #ff00ff",
              }}>
              FIRE
            </button>
          </div>
        </div>
      )}

      {state !== "playing" && (
        <div
          className="start-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(2,2,8,0.88)",
            color: "white",
            fontFamily: "monospace",
            zIndex: 20,
            padding: "0 20px",
            boxSizing: "border-box",
          }}>
          <h1
            className="title"
            style={{
              fontSize: "clamp(2rem, 8vw, 3.5rem)",
              marginBottom: 24,
              letterSpacing: "4px",
              color: "#00ffff",
              textShadow: "0 0 15px #00ffff",
              textAlign: "center",
            }}>
            ORBIT RUNNER
          </h1>

          {state === "menu" && (
            <button className="play-btn" onClick={start} style={menuBtnStyle}>
              PLAY
            </button>
          )}

          {state === "gameover" && (
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  color: "#ff00ff",
                  fontSize: "clamp(1.4rem, 5vw, 2rem)",
                  marginBottom: 12,
                  textShadow: "0 0 10px #ff00ff",
                }}>
                (GAME OVER)
              </h2>
              <p
                style={{
                  fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)",
                  marginBottom: 24,
                  color: "#00ffff",
                }}>
                Final Score: {score}
              </p>
              <button onClick={start} style={menuBtnStyle}>
                REBOOT
              </button>
            </div>
          )}

          {state === "paused" && (
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 5vw, 2rem)",
                  marginBottom: 24,
                  color: "#00ffff",
                  textShadow: "0 0 10px #00ffff",
                }}>
                PROCESS PAUSED
              </h2>
              <button onClick={handlePauseToggle} style={menuBtnStyle}>
                RESUME
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const mobileBtnStyle: React.CSSProperties = {
  width: "clamp(55px, 14vw, 70px)",
  height: "clamp(55px, 14vw, 70px)",
  borderRadius: "50%",
  border: "2px solid",
  background: "rgba(2, 2, 8, 0.75)",
  fontSize: "clamp(0.8rem, 2.2vw, 1rem)",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

const menuBtnStyle: React.CSSProperties = {
  padding: "14px 42px",
  fontSize: "clamp(1rem, 3vw, 1.25rem)",
  fontWeight: "bold",
  color: "#020208",
  background: "#00ffff",
  border: "2px solid #00ffff",
  borderRadius: "30px",
  cursor: "pointer",
  boxShadow: "0px 0px 20px #00ffff",
  letterSpacing: "2px",
  WebkitTapHighlightColor: "transparent",
};
