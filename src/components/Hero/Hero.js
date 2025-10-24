import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import logo from "../../logo.png";
import "./Hero.css";

function Hero() {
  const scrollerRef = useRef(null);
  const smoothRef = useRef(false);
  const programmaticRef = useRef(false);
  const programmaticTimerRef = useRef(null);

  const slides = useMemo(
    () => [
      {
        title: "PeloAPelo",
        text: "La plataforma líder para intercambios seguros. Vende, compra o intercambia con nuestra comunidad verificada.",
        background: "var(--color-primary-soft)",
        ctas: [{ to: "/register", label: "Comenzar ahora", primary: true }],
      },
      {
        title: "Comunidad Verificada",
        text: "Tu seguridad es nuestra prioridad. Todos los usuarios pasan por un riguroso proceso de verificación de identidad con foto personal y documento oficial.",
        background: "var(--color-success-soft)",
        ctas: [
          { to: "/register", label: "Verificar mi cuenta", primary: true },
        ],
      },
      {
        title: "Publica en Segundos",
        text: "Sube hasta 5 fotos, describe tu artículo y elige si quieres vender o intercambiar. Sin complicaciones, sin esperas.",
        background: "var(--color-accent-soft)",
        ctas: [{ to: "/publish", label: "Crear publicación", primary: true }],
      },
      {
        title: "Chat Integrado",
        text: "Negocia directamente con otros usuarios a través de nuestro chat seguro. Coordina los detalles del intercambio o venta sin salir de la app.",
        background: "var(--color-info-soft)",
        ctas: [{ to: "/inbox", label: "Ver mensajes", primary: true }],
      },
      {
        title: "Sistema de Reputación",
        text: "Construye tu reputación con cada intercambio exitoso. Los usuarios mejor valorados obtienen más visibilidad y confianza en la comunidad.",
        background: "var(--color-warning-soft)",
        ctas: [
          { to: "/reputation", label: "Ver mi reputación", primary: true },
        ],
      },
    ],
    [],
  );

  const baseLength = slides.length;
  const initialIndex = baseLength; // start in the middle block
  const loopSlides = useMemo(() => [...slides, ...slides, ...slides], [slides]);
  const [virtualIndex, setVirtualIndex] = useState(initialIndex);

  // Eliminamos el auto-scroll para mejor experiencia de usuario

  // Mover el slide activo
  useEffect(() => {
    const rail = scrollerRef.current;
    if (!rail) return;
    const el = rail.children[virtualIndex];
    if (!el) return;
    programmaticRef.current = true;
    const behavior = smoothRef.current ? "smooth" : "auto";
    el.scrollIntoView({ behavior, inline: "start", block: "nearest" });
    smoothRef.current = true;
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    programmaticTimerRef.current = setTimeout(
      () => {
        programmaticRef.current = false;
      },
      behavior === "smooth" ? 500 : 0,
    );
    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
        programmaticTimerRef.current = null;
      }
    };
  }, [virtualIndex]);

  // keep loop seamless by jumping back to middle block when needed
  useEffect(() => {
    if (virtualIndex >= baseLength * 2) {
      smoothRef.current = false;
      setVirtualIndex((prev) => prev - baseLength);
      return;
    }
    if (virtualIndex < baseLength) {
      smoothRef.current = false;
      setVirtualIndex((prev) => prev + baseLength);
    }
  }, [virtualIndex, baseLength]);

  // sync with manual scroll
  useEffect(() => {
    const rail = scrollerRef.current;
    if (!rail) return;
    let frame = null;

    const handleScroll = () => {
      if (programmaticRef.current) return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(rail.children);
        if (!children.length) return;
        const scrollLeft = rail.scrollLeft;
        let nearestIndex = virtualIndex;
        let minDiff = Infinity;
        children.forEach((child, index) => {
          const diff = Math.abs(child.offsetLeft - scrollLeft);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = index;
          }
        });
        if (nearestIndex !== virtualIndex) {
          smoothRef.current = false;
          setVirtualIndex(nearestIndex);
        }
      });
    };

    rail.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      rail.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [virtualIndex]);

  const activeIndex = ((virtualIndex % baseLength) + baseLength) % baseLength;

  const goToSlide = (i) => {
    smoothRef.current = true;
    setVirtualIndex(baseLength + i);
  };

  return (
    <section className="hero container">
      <div>
        <div ref={scrollerRef} className="hero-scroll">
          {loopSlides.map((slide, i) => (
            <div
              key={i}
              className="hero-box"
              style={{ background: slide.background }}
            >
              <div className="hero-content">
                <div className="hero-brand">
                  <img src={logo} alt="" className="brand-logo" />
                  <h1 className="h1">{slide.title}</h1>
                </div>
                <p className="hero-text">{slide.text}</p>
                {!!slide.ctas.length && (
                  <div className="hero-cta">
                    {slide.ctas.map((cta, j) => (
                      <Link
                        key={j}
                        to={cta.to}
                        className={`btn ${cta.primary ? "primary" : "outline"}`}
                      >
                        {cta.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => goToSlide(i)}
              className={`hero-dot ${i === activeIndex ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
