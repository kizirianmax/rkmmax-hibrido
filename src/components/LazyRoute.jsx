// src/components/LazyRoute.jsx
import React, { Suspense } from "react";

export default function LazyRoute({ children }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "4px solid #f3f4f6",
                borderTop: "4px solid #6366f1",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#6b7280", fontSize: 14 }}>Carregando...</p>
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
