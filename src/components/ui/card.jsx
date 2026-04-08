// src/components/ui/card.jsx
import React from "react";

export function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-lg border bg-white shadow-sm ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}
