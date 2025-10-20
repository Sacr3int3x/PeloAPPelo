import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Select.css";

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  required = false,
  name,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const menuRef = useRef(null);

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Ensure the active/selected option is visible
    const idx = Math.max(
      0,
      selected ? options.findIndex((o) => o.value === selected.value) : 0,
    );
    setActiveIndex(idx);
    const el = menuRef.current?.querySelector(`[data-index='${idx}']`);
    if (el && menuRef.current) {
      const top = el.offsetTop - menuRef.current.clientHeight / 2 + el.clientHeight / 2;
      menuRef.current.scrollTo({ top, behavior: "instant" });
    }
  }, [open, options, selected]);

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  const selectAt = (idx) => {
    const opt = options[idx];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (activeIndex >= 0) selectAt(activeIndex);
      return;
    }
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
  };

  return (
    <div className={`select-field ${className}`} ref={ref}>
      {label && (
        <label className="select-label" htmlFor={name}>
          {label}
        </label>
      )}

      <div
        className={`select-control ${open ? "open" : ""}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${name}-listbox`}
        aria-owns={`${name}-listbox`}
        onKeyDown={onKeyDown}
      >
        <button
          type="button"
          id={name}
          className={`select-input ${!selected ? "select-placeholder" : ""}`}
          aria-controls={`${name}-listbox`}
          aria-label={label || name}
          onClick={toggle}
        >
          {selected ? selected.label : placeholder}
        </button>

        <svg className="select-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div
          ref={menuRef}
          id={`${name}-listbox`}
          className="select-menu"
          role="listbox"
        >
          {options.map((opt, idx) => {
            const isSelected = selected && selected.value === opt.value;
            return (
              <div
                key={opt.value}
                id={`${name}-option-${idx}`}
                className={`select-option ${isSelected ? "active" : ""}`}
                role="option"
                aria-selected={isSelected}
                data-index={idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectAt(idx)}
              >
                <span>{opt.label}</span>
                {isSelected ? (
                  <span aria-hidden>✓</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {required ? (
        <input tabIndex={-1} aria-hidden name={name} value={value || ""} onChange={() => {}} required style={{position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none"}} />
      ) : null}
    </div>
  );
}
