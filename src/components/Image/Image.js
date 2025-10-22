import React from "react";
import PropTypes from "prop-types";

const Image = ({
  src,
  alt,
  className,
  width,
  height,
  loading = "lazy",
  sizes = "100vw",
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setError(true);
    if (onError) onError(e);
  };

  if (error) {
    return (
      <div
        className={`image-error ${className || ""}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`image-wrapper ${isLoading ? "loading" : ""}`}>
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />
      {isLoading && (
        <div className="image-placeholder" aria-hidden="true">
          <div className="image-skeleton"></div>
        </div>
      )}
    </div>
  );
};

Image.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.oneOf(["lazy", "eager"]),
  sizes: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default Image;
