import React, { useEffect, useRef } from "react";

function generateQRMatrix(data, size = 33) {
  // Simple QR-like matrix generator for visual display
  const matrix = [];
  let seed = 0;
  for (let i = 0; i < data.length; i++) {
    seed = ((seed << 5) - seed + data.charCodeAt(i)) | 0;
  }
  
  for (let row = 0; row < size; row++) {
    matrix[row] = [];
    for (let col = 0; col < size; col++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const inTopLeft = row < 7 && col < 7;
      const inTopRight = row < 7 && col >= size - 7;
      const inBottomLeft = row >= size - 7 && col < 7;
      
      if (inTopLeft || inTopRight || inBottomLeft) {
        const localRow = inBottomLeft ? row - (size - 7) : row;
        const localCol = inTopRight ? col - (size - 7) : col;
        const isOuter = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
        const isInner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
        matrix[row][col] = isOuter || isInner ? 1 : 0;
      } else {
        // Data area - deterministic pseudo-random based on data
        seed = (seed * 16807 + 12345) & 0x7fffffff;
        matrix[row][col] = ((seed >> 16) & 1) === 1 ? 1 : 0;
      }
    }
  }
  return matrix;
}

export default function QRCodeDisplay({ data, size = 260, color = "#0A1931" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const moduleCount = 33;
    const scale = 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const matrix = generateQRMatrix(data, moduleCount);
    const cellSize = (size * scale) / moduleCount;
    const radius = cellSize * 0.35;
    
    matrix.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell) {
          ctx.fillStyle = color;
          const x = colIdx * cellSize;
          const y = rowIdx * cellSize;
          
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, radius);
          ctx.fill();
        }
      });
    });
  }, [data, size, color]);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ width: size, height: size }}
    />
  );
}