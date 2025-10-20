import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../../logo.png";
import "./Hero.css";

function Hero() {
  const scrollerRef = useRef(null);
  const [idx, setIdx] = useState(0);

  const slides = [
    {
      title: "Pelo a Pelo",
      text: "La forma simple de intercambiar o vender vehículos y celulares. Publica rápido, negocia directo y encuentra tu mejor trato.",
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
  ];

  // Auto-avance cada 8 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Mover el slide activo
  useEffect(() => {
    const rail = scrollerRef.current;
    if (!rail) return;
    const el = rail.children[idx];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
  }, [idx]);

  return (
    <section className="hero container">
      <div>
        <div ref={scrollerRef} className="hero-scroll">
          {slides.map((slide, i) => (
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
              onClick={() => setIdx(i)}
              className={`hero-dot ${i === idx ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
