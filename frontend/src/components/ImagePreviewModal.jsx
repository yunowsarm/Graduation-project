/* eslint-disable react/prop-types */
import { useState } from "react";
import styles from "./ImagePreviewModal.module.css";
import ReactModal from "react-modal";

ReactModal.setAppElement("#root");

function ImagePreviewModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });

  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetZoomAndPosition();
    }
  };

  const handlePrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetZoomAndPosition();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prevZoom) =>
      Math.min(Math.max(prevZoom + zoomChange, 0.5), 3)
    );
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - startDragPosition.x;
      const deltaY = e.clientY - startDragPosition.y;
      setImagePosition((prevPosition) => ({
        x: prevPosition.x + deltaX,
        y: prevPosition.y + deltaY,
      }));
      setStartDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoomAndPosition = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  return (
    <ReactModal
      isOpen={true}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>
      <div
        className={styles.modalContent}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <button
          className={styles.sideButton}
          onClick={handlePrevImage}
          style={{ left: 0 }}
          disabled={currentIndex === 0}
        >
          <i className="fi fi-rs-angle-left"></i>
        </button>
        <div className={styles.imageWrapper}>
          <img
            src={images[currentIndex]}
            alt="预览图片"
            className={styles.modalImage}
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          />
        </div>
        <button
          className={styles.sideButton}
          onClick={handleNextImage}
          style={{ right: 0 }}
          disabled={currentIndex === images.length - 1}
        >
          <i className="fi fi-rs-angle-right"></i>
        </button>
      </div>
    </ReactModal>
  );
}

export default ImagePreviewModal;
