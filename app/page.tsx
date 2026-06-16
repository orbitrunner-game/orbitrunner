"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Game3D from "../components/Game3D/Game3D";

export default function Home() {
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const gameSectionRef = useRef<HTMLDivElement | null>(null);
  const controlsSectionRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showNavbar, setShowNavbar] = useState(true);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const lastScrollY = useRef(0);

  const scrollToSection = (
    elementRef: React.RefObject<HTMLDivElement | null>,
  ) => {
    elementRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 70) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const dirLight1 = new THREE.DirectionalLight(0xff00ff, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00ffff, 1.5);
    dirLight2.position.set(-5, 5, 5);
    scene.add(dirLight2);

    const ambLight = new THREE.AmbientLight(0x222244);
    scene.add(ambLight);

    const ballGroup = new THREE.Group();
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
    ballGroup.add(coreBall);

    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.08, 6, 24),
      ringMat,
    );
    orbitRing.rotation.x = Math.PI / 3;
    ballGroup.add(orbitRing);

    ballGroup.position.set(-3.5, 0, 0);
    scene.add(ballGroup);

    const monsterGroup = new THREE.Group();
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
      new THREE.SphereGeometry(0.9, 10, 10),
      monsterMat,
    );
    body.scale.set(1, 1.1, 1);
    monsterGroup.add(body);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), eyeMat);
    eye.position.set(0, 0.2, 0.7);
    monsterGroup.add(eye);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      pupilMat,
    );
    pupil.position.set(0, 0.2, 0.95);
    monsterGroup.add(pupil);

    const hornGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.4, 0.9, 0);
    leftHorn.rotation.z = 0.3;
    monsterGroup.add(leftHorn);

    const rightHorn = leftHorn.clone();
    rightHorn.position.x = 0.4;
    rightHorn.rotation.z = -0.3;
    monsterGroup.add(rightHorn);

    monsterGroup.position.set(3.5, 0, 0);
    scene.add(monsterGroup);

    const updateLayout = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        ballGroup.position.set(0, 1.6, 0);
        monsterGroup.position.set(0, -1.8, 0);
        ballGroup.scale.set(0.65, 0.65, 0.65);
        monsterGroup.scale.set(0.65, 0.65, 0.65);
      } else {
        ballGroup.position.set(-3.8, 0, 0);
        monsterGroup.position.set(3.8, 0, 0);
        ballGroup.scale.set(1.2, 1.2, 1.2);
        monsterGroup.scale.set(1.2, 1.2, 1.2);
      }
    };
    updateLayout();

    let clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      ballGroup.position.y += Math.sin(elapsedTime * 2) * 0.003;
      coreBall.rotation.y += 0.01;
      orbitRing.rotation.z += 0.02;

      monsterGroup.position.y += Math.cos(elapsedTime * 1.5) * 0.003;
      monsterGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateLayout();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#03030a",
        color: "#ffffff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: "100dvh",
        overflowX: "hidden",
      }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          backgroundColor: "#03030a",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: gameLoaded ? "none" : "all",
          opacity: gameLoaded ? 0 : 1,
          transition: "opacity 1s cubic-bezier(0.23, 1, 0.32, 1)",
        }}>
        <div className="tech-font" style={{ marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "2.8rem",
              fontWeight: "900",
              letterSpacing: "8px",
              color: "#ffffff",
              textShadow: "0 0 40px rgba(0, 255, 255, 0.5)",
            }}>
            ORBIT RUNNER
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
          <div
            className="cyber-spinner"
            style={{
              width: "70px",
              height: "70px",
              border: "3px solid rgba(0, 255, 255, 0.05)",
              borderTop: "3px solid #00ffff",
              borderBottom: "3px solid #ff00ff",
              borderRadius: "50%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
              marginBottom: "24px",
            }}>
            <div
              className="tech-font"
              style={{
                fontSize: "0.85rem",
                color: "#00ffff",
                fontWeight: "bold",
                textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
              }}>
              {loadProgress}%
            </div>
          </div>

          <div
            className="tech-font"
            style={{
              fontSize: "0.9rem",
              color: "#64748b",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}>
            LOADING
          </div>
        </div>

        <div
          style={{
            marginTop: "60px",
            fontSize: "0.8rem",
            color: "#334155",
            letterSpacing: "2px",
          }}
          className="tech-font">
          ENJOY!
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        .tech-font { font-family: 'Share Tech Mono', monospace !important; }

        .cyber-spinner {
          animation: spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes bounceArrow { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(8px); opacity: 1; color: #00ffff; text-shadow: 0 0 10px #00ffff; } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.25; transform: scale(1.05); } }
        
        .scroll-arrow { animation: bounceArrow 2s infinite ease-in-out; }
        .bg-glow { animation: pulseGlow 10s infinite ease-in-out; }

        .cyber-button {
          position: relative;
          padding: 16px 50px;
          font-size: 1.15rem;
          font-weight: 700;
          color: #03030a;
          background-color: #00ffff;
          border: 1px solid #00ffff;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        .cyber-button:hover {
          background-color: transparent;
          color: #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5), 0 0 10px rgba(255, 0, 255, 0.3);
          transform: translateY(-2px);
        }

        .premium-card {
          background: linear-gradient(135deg, rgba(20, 20, 35, 0.4) 0%, rgba(10, 10, 20, 0.6) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 40px 30px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          backdrop-filter: blur(12px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-card:hover {
          border-color: rgba(0, 255, 255, 0.3);
          box-shadow: 0 30px 60px rgba(0,0,0,0.6), 0 0 20px rgba(0, 255, 255, 0.1);
          transform: translateY(-5px);
        }

        .nav-link {
          color: #94a3b8;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #00ffff; }

        @media (max-width: 768px) {
          .nav-menu { display: none !important; }
          .hero-title { font-size: 2.8rem !important; letter-spacing: 4px !important; margin-top: 30px; }
          .hero-desc { font-size: 0.95rem !important; line-height: 1.5 !important; margin-bottom: 30px !important; padding: 0 10px; }
          .cyber-button { padding: 12px 34px !important; font-size: 1rem !important; }
          .section-title { font-size: 1.8rem !important; margin-bottom: 35px !important; letter-spacing: 3px !important; }
          .controls-grid { gap: 20px !important; padding: 0 10px !important; }
          .premium-card { padding: 25px 20px !important; }
          .logistics-box { font-size: 0.9rem !important; padding: 15px !important; }
          .game-container-section { height: 100dvh !important; padding-top: 60px !important; box-sizing: border-box; }
          .mobile-controls { bottom: 25px !important; }
        }
      `,
        }}
      />

      <nav
        style={{
          position: "fixed",
          top: showNavbar ? "0" : "-70px",
          left: 0,
          width: "100%",
          height: "70px",
          backgroundColor: "rgba(3, 3, 10, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
          boxSizing: "border-box",
          zIndex: 100,
          transition: "top 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
        <div
          className="tech-font"
          style={{
            fontSize: "1.3rem",
            fontWeight: "900",
            color: "#ffffff",
            letterSpacing: "2px",
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => scrollToSection(heroSectionRef)}>
          ORBIT RUNNER
        </div>
        <div className="nav-menu" style={{ display: "flex", gap: "30px" }}>
          <button
            className="nav-link"
            onClick={() => scrollToSection(heroSectionRef)}>
            Home
          </button>
          <button
            className="nav-link"
            onClick={() => scrollToSection(gameSectionRef)}>
            Play Game
          </button>
          <button
            className="nav-link"
            onClick={() => scrollToSection(controlsSectionRef)}>
            How to Play
          </button>
        </div>

        <a
          href="https://x.com/orbitrunnergame"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#94a3b8",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#00ffff")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}>
          {/* <XIcon size={22} /> */}X @Orbitrunnergame
        </a>
      </nav>

      <section
        ref={heroSectionRef}
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "70px 24px 0 24px",
          position: "relative",
          background:
            "radial-gradient(circle at center, #09091e 0%, #03030a 75%)",
          overflow: "hidden",
        }}>
        <canvas
          ref={heroCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div
          className="bg-glow"
          style={{
            position: "absolute",
            top: "25%",
            left: "15%",
            width: "300px",
            height: "300px",
            background:
              "radial-gradient(circle, rgba(255, 0, 255, 0.1) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          className="bg-glow"
          style={{
            position: "absolute",
            bottom: "20%",
            right: "15%",
            width: "350px",
            height: "350px",
            background:
              "radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%)",
            filter: "blur(95px)",
            pointerEvents: "none",
            animationDelay: "5s",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ zIndex: 2, position: "relative" }}>
          <h1
            className="hero-title tech-font"
            style={{
              fontSize: "6rem",
              fontWeight: "900",
              color: "#ffffff",
              textShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
              letterSpacing: "12px",
              marginBottom: "24px",
              lineHeight: "1.1",
            }}>
            ORBIT RUNNER
          </h1>

          <p
            className="hero-desc"
            style={{
              fontSize: "1.35rem",
              color: "#94a3b8",
              maxWidth: "720px",
              margin: "0 auto 50px auto",
              lineHeight: "1.7",
              letterSpacing: "0.5px",
              fontWeight: "400",
            }}>
            Control the core energy ball, dodge dangerous mutated monsters,
            cross cyber bridges, and override the high score terminal!
          </p>

          <button
            onClick={() => scrollToSection(gameSectionRef)}
            className="cyber-button tech-font">
            PLAY GAME
          </button>
        </div>

        <div
          className="scroll-arrow"
          onClick={() => scrollToSection(gameSectionRef)}
          style={{
            position: "absolute",
            bottom: "25px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "rgba(255,255,255,0.4)",
            userSelect: "none",
            zIndex: 5,
          }}>
          <span
            className="tech-font"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "4px",
              marginBottom: "8px",
              opacity: 0.8,
            }}>
            SCROLL TO ENTER
          </span>
          <span style={{ fontSize: "1.1rem" }}>↓</span>
        </div>
      </section>

      <section
        ref={gameSectionRef}
        className="game-container-section"
        style={{
          width: "100vw",
          height: "100dvh",
          backgroundColor: "#020208",
          position: "relative",
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
        }}>
        <Game3D
          onProgress={(progress) => setLoadProgress(progress)}
          onLoadComplete={() => setGameLoaded(true)}
        />
      </section>

      <section
        ref={controlsSectionRef}
        style={{
          padding: "100px 24px",
          maxWidth: "1140px",
          margin: "0 auto",
          textAlign: "center",
        }}>
        <h2
          className="section-title tech-font"
          style={{
            fontSize: "3rem",
            color: "#ffffff",
            marginBottom: "60px",
            letterSpacing: "6px",
            fontWeight: "bold",
          }}>
          SYSTEM CONTROLS
        </h2>

        <div
          className="controls-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "40px",
            textAlign: "left",
          }}>
          <div className="premium-card">
            <div className="tech-font" style={iconStyle}>
              A / D
            </div>
            <h3 style={cardTitleStyle}>Lane Switching</h3>
            <p style={cardDescStyle}>
              Press <strong>A</strong> on your keyboard to steer Left, and{" "}
              <strong>D</strong> to switch to the Right lane instantly.
            </p>
          </div>

          <div className="premium-card">
            <div className="tech-font" style={iconStyle}>
              SPACE
            </div>
            <h3 style={cardTitleStyle}>Jump & Bounce</h3>
            <p style={cardDescStyle}>
              Press <strong>Spacebar</strong> to execute a high jump over space
              monsters. The energy ball bounces dynamically upon landing.
            </p>
          </div>

          <div className="premium-card">
            <div className="tech-font" style={iconStyle}>
              MOUSE_R
            </div>
            <h3 style={cardTitleStyle}>Blaster Weapon</h3>
            <p style={cardDescStyle}>
              Use <strong>Right-Click</strong> anywhere on the screen to fire a
              plasma beam and vaporize monster anomalies blocking your vector.
            </p>
          </div>
        </div>

        <div
          className="logistics-box"
          style={{
            marginTop: "60px",
            padding: "30px 40px",
            border: "1px solid rgba(0, 255, 255, 0.15)",
            borderRadius: "8px",
            backgroundColor: "rgba(0, 240, 255, 0.01)",
            color: "#94a3b8",
            letterSpacing: "0.5px",
            fontSize: "1.1rem",
            lineHeight: "1.6",
          }}>
          <span
            className="tech-font"
            style={{
              color: "#00ffff",
              fontWeight: "bold",
              marginRight: "10px",
              letterSpacing: "2px",
            }}>
            LOGISTICS MODULE:
          </span>
          Intercept orange matrix cylinders to replenish your{" "}
          <strong style={{ color: "#ffffff" }}>Ammo</strong> and blue energy
          cylinders for a massive{" "}
          <strong style={{ color: "#ffffff" }}>Score compilation</strong> boost.
        </div>
      </section>

      <footer
        style={{
          padding: "50px 24px",
          textAlign: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          color: "#475569",
          fontSize: "0.9rem",
          backgroundColor: "#010103",
          letterSpacing: "1px",
        }}>
        <p
          className="tech-font"
          style={{ marginBottom: "12px", fontSize: "0.95rem", opacity: 0.8 }}>
          &copy; {new Date().getFullYear()} ORBIT_RUNNER
        </p>
        <p style={{ fontSize: "0.8rem", color: "#334155" }}>
          Engineered via Next.js & Three.js WebGL Framework architectures.
        </p>
      </footer>
    </div>
  );
}

const iconStyle: React.CSSProperties = {
  fontSize: "1.4rem",
  color: "#00ffff",
  backgroundColor: "rgba(0, 255, 255, 0.06)",
  padding: "6px 16px",
  borderRadius: "4px",
  display: "inline-block",
  marginBottom: "25px",
  letterSpacing: "2px",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  color: "#ffffff",
  marginBottom: "14px",
  letterSpacing: "0.5px",
  fontWeight: "700",
};

const cardDescStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "#64748b",
  lineHeight: "1.6",
};
