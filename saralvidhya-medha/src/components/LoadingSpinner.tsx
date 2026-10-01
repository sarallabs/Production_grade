import React from 'react';

export default function LoadingSpinner() {
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        gap: "20px",
      }}
    >
      <style>{`
        @keyframes logoPulseGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.25)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.45)); }
        }
        @keyframes spinnerRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Outer Ring & Prominent Logo */}
      <div style={{ position: "relative", width: "270px", height: "270px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Animated Gradient Spinner Ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "6px solid #eff6ff",
            borderTopColor: "#2563eb",
            borderRightColor: "#60a5fa",
            animation: "spinnerRing 0.9s linear infinite",
          }}
        />
        {/* Large Prominent Saral Vidhya Logo */}
        <img
          src={treeLogoSrc}
          alt="Saral Vidhya"
          style={{
            width: "180px",
            height: "180px",
            objectFit: "contain",
            animation: "logoPulseGlow 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
