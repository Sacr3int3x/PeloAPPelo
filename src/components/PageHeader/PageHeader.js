import React from "react";
import PropTypes from "prop-types";
import "./PageHeader.css";

function PageHeader({ title, children }) {
  return (
    <div className="page-header">
      {children}
      <h1 className="h1">{title}</h1>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default PageHeader;
