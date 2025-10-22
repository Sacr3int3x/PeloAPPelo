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
        text: "La forma simple de intercambiar o vender tus artículos. Publica rápido, negocia directo y encuentra tu mejor trato.",
        background: "var(--color-primary-soft)",
        ctas: [],
    },
    {
      title: "Publica Gratis",
      text: "Sube hasta 5 fotos, agrega detalles y comparte.",
      background: "var(--color-surface)",
      ctas: [{ to: "/publish", label: "Publicar ahora", primary: true }],
    },
    {
      title: 'Sin bloqueos por "cambio"',
        text: '¿Cansado de restricciones molestas? Aquí puedes escribir "aceptas cambio? donde gustes" sin bloqueos automáticos ni filtros molestos.',
        background: "var(--color-surface-subtle)",
        ctas: [],
      },
    ],
    [],
  );

  const baseLength = slides.length;
  const initialIndex = baseLength; // start in the middle block
  const loopSlides = useMemo(
    () => [...slides, ...slides, ...slides],
    [slides],
  );
  const [virtualIndex, setVirtualIndex] = useState(initialIndex);

  // Auto-avance cada 8 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      smoothRef.current = true;
      setVirtualIndex((i) => i + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, [baseLength]);

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
    programmaticTimerRef.current = setTimeout(() => {
      programmaticRef.current = false;
    }, behavior === "smooth" ? 500 : 0);
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
