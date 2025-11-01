import React from "react";
import PropTypes from "prop-types";
import "./PageHeader.css";

function PageHeader({ title, subtitle, children, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        {children}
        <div className="page-header-text">
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
};

export default PageHeader;
