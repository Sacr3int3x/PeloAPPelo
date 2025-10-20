import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./LoadingOverlay.css";
import logo from "../../logo.png";

const fallbackSteps = [
  { label: "Preparando datos..." },
  { label: "Procesando solicitud..." },
  { label: "Casi listo..." },
];

function LoadingOverlay({ active, steps = fallbackSteps, onComplete }) {
  const normalizedSteps = useMemo(
    () =>
      steps.length
        ? steps.map((step) => ({
            label: step.label || "Procesando...",
            duration: step.duration || 1000,
          }))
        : fallbackSteps,
    [steps],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setCurrentIndex(0);
      setProgress(0);
      return;
    }
    setVisible(true);
    let cancelled = false;

    const run = async () => {
      const totalDuration = normalizedSteps.reduce(
        (acc, step) => acc + step.duration,
        0,
      );
      let elapsed = 0;
      for (let i = 0; i < normalizedSteps.length; i += 1) {
        if (cancelled) return;
        setCurrentIndex(i);
        const step = normalizedSteps[i];
        const baseProgress = Math.round((elapsed / totalDuration) * 100);
        setProgress(i === 0 ? Math.max(baseProgress, 8) : baseProgress);
        await new Promise((resolve) => setTimeout(resolve, step.duration));
        elapsed += step.duration;
      }
      if (!cancelled) {
        setProgress(100);
        setCurrentIndex(normalizedSteps.length - 1);
        await new Promise((resolve) => setTimeout(resolve, 600));
        onComplete?.();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [active, normalizedSteps, onComplete]);

  if (!visible) return null;

  const currentStep = normalizedSteps[currentIndex] || normalizedSteps[0];

  return (
    <div className="loading-overlay" role="status" aria-live="assertive">
      <div className="loading-card">
        <div className="loading-icon">
          <img src={logo} alt="" />
        </div>
        <h2 className="loading-title">peloAPPelo</h2>
        <p className="loading-step">{currentStep?.label}</p>
        <div className="loading-progress">
          <div
            className="loading-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

LoadingOverlay.propTypes = {
  active: PropTypes.bool,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      duration: PropTypes.number,
    }),
  ),
  onComplete: PropTypes.func,
};

LoadingOverlay.defaultProps = {
  active: false,
  steps: fallbackSteps,
  onComplete: undefined,
};

export default LoadingOverlay;
