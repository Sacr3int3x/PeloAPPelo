import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error para debugging
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);

    // Actualizar estado con información del error
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // En producción, aquí se podría enviar a un servicio de logging
    if (process.env.NODE_ENV === "production") {
      // Ejemplo: Sentry.captureException(error, { extra: errorInfo });
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Placeholder para servicio de logging externo
    const errorData = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Aquí se enviaría a tu servicio de logging
    console.log("Error logged:", errorData);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === "development";

      // Si hay múltiples errores consecutivos, mostrar opción de limpiar caché
      const showClearCache = errorCount > 2;

      return (
        <div
          className="container page"
          style={{
            padding: "2rem",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              backgroundColor: "#fee",
              border: "2px solid #fcc",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            <h2 style={{ color: "#c00", marginTop: 0 }}>⚠️ Algo salió mal</h2>

            <p style={{ marginBottom: "1.5rem" }}>
              Lo sentimos, ha ocurrido un error inesperado. Puedes intentar
              recargar la página o regresar al inicio.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                className="btn primary"
                onClick={this.handleReset}
                style={{ flex: "1", minWidth: "120px" }}
              >
                Intentar de nuevo
              </button>

              <button
                className="btn secondary"
                onClick={this.handleReload}
                style={{ flex: "1", minWidth: "120px" }}
              >
                Recargar página
              </button>

              <button
                className="btn"
                onClick={() => (window.location.href = "/#/")}
                style={{ flex: "1", minWidth: "120px" }}
              >
                Ir al inicio
              </button>
            </div>

            {showClearCache && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#fff3cd",
                  borderRadius: "4px",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  💡 Si el problema persiste, intenta limpiar el caché del
                  navegador.
                </p>
              </div>
            )}

            {isDevelopment && error && (
              <details style={{ marginTop: "1.5rem" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#666",
                  }}
                >
                  Detalles del error (solo visible en desarrollo)
                </summary>
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    overflow: "auto",
                  }}
                >
                  <pre style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                    <strong>Error:</strong> {error.toString()}
                    {"\n\n"}
                    <strong>Stack:</strong>
                    {"\n"}
                    {error.stack}
                    {errorInfo?.componentStack && (
                      <>
                        {"\n\n"}
                        <strong>Component Stack:</strong>
                        {"\n"}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            )}
          </div>

          {this.props.showContactInfo !== false && (
            <div
              style={{ marginTop: "2rem", textAlign: "center", color: "#666" }}
            >
              <p style={{ fontSize: "0.9rem" }}>
                Si el problema continúa, por favor contacta a soporte.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
