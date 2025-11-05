import React from "react";

const Card = ({ children, className = "", hover = false }) => (
  <div
    className={`bg-white rounded-xl shadow-md p-6 ${
      hover ? "hover:shadow-xl transition-shadow duration-200" : ""
    } ${className}`}
  >
    {children}
  </div>
);

export default Card;
