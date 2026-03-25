import React from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Real, scannable QR code using qrcode.react.
 * Replaces the previous fake/pseudo-random canvas renderer.
 */
export default function QRCodeDisplay({ data, size = 260 }) {
  return (
    <QRCodeSVG
      value={data || "sharkband:loading"}
      size={size}
      bgColor="#ffffff"
      fgColor="#0a0f1a"
      level="M"
      includeMargin={true}
    />
  );
}
