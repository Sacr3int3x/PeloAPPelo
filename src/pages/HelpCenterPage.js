import React, { useState } from "react";
import {
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiShield,
  FiMapPin,
  FiEye,
  FiAlertTriangle,
} from "react-icons/fi";
import "../styles/HelpCenterPage.css";

const HelpCenterPage = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Cuenta y Seguridad",
      icon: <FiShield />,
      questions: [
        {
          id: 1,
          question: "¿Cómo creo una cuenta en PeloAPelo?",
          answer:
            "Haz clic en 'Registrarse', completa el formulario con tu información básica, verifica tu correo electrónico y ¡listo! Ya puedes empezar a intercambiar.",
        },
        {
          id: 2,
          question: "¿Es seguro intercambiar en PeloAPelo?",
          answer:
            "Sí, contamos con sistema de verificación de usuarios, sistema de reputación basado en calificaciones, y recomendaciones de seguridad para cada intercambio.",
        },
        {
          id: 3,
          question: "¿Cómo protegen mi información personal?",
          answer:
            "Utilizamos encriptación de datos, no compartimos tu información con terceros sin tu consentimiento, y cumplimos con las normativas de protección de datos vigentes.",
        },
      ],
    },
    {
      category: "Publicaciones",
      icon: <FiEye />,
      questions: [
        {
          id: 4,
          question: "¿Cómo publico un artículo para intercambio?",
          answer:
            "Ve a 'Publicar', agrega fotos claras del artículo, describe su estado y características, indica qué artículos te interesan a cambio, y publica.",
        },
        {
          id: 5,
          question: "¿Puedo editar o eliminar mi publicación?",
          answer:
            "Sí, desde tu perfil puedes editar la descripción, fotos y preferencias de intercambio en cualquier momento, o eliminar la publicación si ya no está disponible.",
        },
        {
          id: 6,
          question: "¿Cuánto tiempo permanece activa una publicación?",
          answer:
            "Las publicaciones permanecen activas indefinidamente hasta que las elimines. Te recomendamos actualizarlas regularmente para mantenerlas visibles.",
        },
        {
          id: 7,
          question: "¿Puedo publicar varios artículos a la vez?",
          answer:
            "Sí, puedes tener múltiples publicaciones activas simultáneamente sin límite.",
        },
      ],
    },
    {
      category: "Intercambios",
      icon: <FiMapPin />,
      questions: [
        {
          id: 8,
          question: "¿Cómo funciona el proceso de intercambio?",
          answer:
            "Busca artículos que te interesen, contacta al usuario mediante chat, acuerden los detalles del intercambio, reúnanse en un lugar público seguro, y confirmen el intercambio en la app.",
        },
        {
          id: 9,
          question: "¿Dónde debo hacer el intercambio?",
          answer:
            "Recomendamos lugares públicos y concurridos como centros comerciales, estaciones de metro, o comisarías que ofrecen zonas seguras para intercambios.",
        },
        {
          id: 10,
          question: "¿Qué hago si el artículo no es como se describió?",
          answer:
            "No completes el intercambio. Reporta la situación a través de la app para que podamos tomar medidas apropiadas.",
        },
        {
          id: 11,
          question: "¿Puedo cancelar un intercambio acordado?",
          answer:
            "Sí, comunica la cancelación al otro usuario lo antes posible por respeto. Cancelaciones frecuentes pueden afectar tu reputación.",
        },
      ],
    },
    {
      category: "Seguridad",
      icon: <FiAlertTriangle />,
      questions: [
        {
          id: 12,
          question: "¿Qué hago si detecto un usuario sospechoso?",
          answer:
            "Usa la función 'Reportar' en el perfil del usuario. Nuestro equipo revisará el caso y tomará las medidas necesarias.",
        },
        {
          id: 13,
          question: "¿Cómo funciona el sistema de calificaciones?",
          answer:
            "Después de cada intercambio, ambos usuarios pueden calificarse mutuamente. Las calificaciones son visibles en los perfiles y ayudan a construir confianza en la comunidad.",
        },
      ],
    },
  ];

  const safetyTips = [
    {
      number: 1,
      title: "Verifica el perfil",
      description:
        "Revisa las calificaciones y reseñas del usuario antes de acordar un intercambio.",
    },
    {
      number: 2,
      title: "Lugar público",
      description:
        "Siempre realiza los intercambios en lugares públicos y concurridos durante el día.",
    },
    {
      number: 3,
      title: "Inspecciona bien",
      description:
        "Revisa cuidadosamente el artículo antes de completar el intercambio.",
    },
    {
      number: 4,
      title: "Confía en tu instinto",
      description:
        "Si algo no te parece bien, cancela el intercambio. Tu seguridad es primero.",
    },
  ];

  const contactMethods = [
    {
      icon: <FiMail />,
      title: "Email",
      description: "Respuesta en 24 horas",
      info: "soporte@peloapelo.cl",
      action: "mailto:soporte@peloapelo.cl",
      disabled: false,
    },
    {
      icon: <FiPhone />,
      title: "Teléfono",
      description: "Lun a Vie, 9:00 - 18:00 hrs",
      info: "+56 9 1234 5678",
      action: "tel:+56912345678",
      disabled: false,
    },
    {
      icon: <FiMessageCircle />,
      title: "Chat en vivo",
      description: "Próximamente",
      info: "En desarrollo",
      action: "#",
      disabled: true,
    },
  ];

  const toggleQuestion = (id) => {
    setActiveQuestion(activeQuestion === id ? null : id);
  };

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <div className="help-hero">
        <div className="help-hero-content">
          <h1>Centro de Ayuda</h1>
          <p>¿En qué podemos ayudarte hoy?</p>

          <div className="help-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar preguntas frecuentes..."
              className="help-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="help-content">
        {/* Preguntas Frecuentes */}
        <section className="faq-section">
          <h2>Preguntas Frecuentes</h2>
          <p className="section-subtitle">
            Encuentra respuestas a las dudas más comunes
          </p>

          {filteredFaqs.length > 0 ? (
            <div className="faq-categories">
              {filteredFaqs.map((category, catIndex) => (
                <div key={catIndex} className="faq-category">
                  <div className="category-header">
                    <div className="category-icon">{category.icon}</div>
                    <h3 className="category-title">{category.category}</h3>
                  </div>

                  <div className="faq-list">
                    {category.questions.map((faq) => (
                      <div
                        key={faq.id}
                        className={`faq-item ${activeQuestion === faq.id ? "active" : ""}`}
                      >
                        <button
                          className="faq-question"
                          onClick={() => toggleQuestion(faq.id)}
                        >
                          <span>{faq.question}</span>
                          <span className="faq-icon">
                            {activeQuestion === faq.id ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </span>
                        </button>

                        {activeQuestion === faq.id && (
                          <div className="faq-answer">
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No encontramos resultados para "{searchQuery}"</p>
              <p>
                Intenta con otras palabras clave o contacta con nuestro equipo
                de soporte
              </p>
            </div>
          )}
        </section>

        {/* Consejos de seguridad */}
        <section className="safety-section">
          <h2>Consejos de Seguridad</h2>
          <p className="section-subtitle">
            Intercambia de forma segura siguiendo estas recomendaciones
          </p>

          <div className="safety-grid">
            {safetyTips.map((tip) => (
              <div key={tip.number} className="safety-card">
                <div className="safety-number">{tip.number}</div>
                <h4>{tip.title}</h4>
                <p>{tip.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Métodos de contacto */}
        <section className="contact-section">
          <h2>¿Necesitas más ayuda?</h2>
          <p className="section-subtitle">
            Nuestro equipo está aquí para ayudarte
          </p>

          <div className="contact-grid">
            {contactMethods.map((method, index) => {
              const CardElement = method.disabled ? "div" : "a";
              return (
                <CardElement
                  key={index}
                  {...(!method.disabled && { href: method.action })}
                  className={`contact-card ${method.disabled ? "disabled" : ""}`}
                >
                  <div className="contact-icon">{method.icon}</div>
                  <h3>{method.title}</h3>
                  <p className="contact-description">{method.description}</p>
                  <p className="contact-info">{method.info}</p>
                </CardElement>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenterPage;
