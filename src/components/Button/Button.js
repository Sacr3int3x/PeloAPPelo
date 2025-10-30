import React from "react";
import "./Button.css";

const Button = ({
  children,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  const buttonClass = [
    "btn",
    variant && `btn-${variant}`,
    size !== "default" && `btn-${size}`,
    disabled && "disabled",
    loading && "loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

export default Button;
