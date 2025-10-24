import React, { useState } from 'react';
import './SwapProposalForm.css';

function SwapProposalForm({ onSubmit, itemPrice }) {
  const [photos, setPhotos] = useState([]);
  const [moneyDirection, setMoneyDirection] = useState('none'); // 'none', 'toBuyer', 'toSeller'
  const [moneyAmount, setMoneyAmount] = useState(0);
  const [description, setDescription] = useState('');

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = await Promise.all(
      files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          src: e.target.result,
          file
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))
    );
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5)); // Máximo 5 fotos
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      photos,
      moneyDirection,
      moneyAmount,
      description
    });
  };

  return (
    <form className="swap-proposal-form" onSubmit={handleSubmit}>
      <div className="swap-photos-section">
        <h3>Fotos del artículo que ofreces</h3>
        <div className="swap-photos-upload">
          <label className="swap-photo-input">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              hidden
            />
            <div className="swap-photo-placeholder">
              <span>+</span>
              <span>Añadir foto</span>
            </div>
          </label>
          {photos.map(photo => (
            <div key={photo.id} className="swap-photo-preview">
              <img src={photo.src} alt="Vista previa" />
              <button
                type="button"
                className="swap-photo-remove"
                onClick={() => removePhoto(photo.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <span className="swap-photos-hint">
          {photos.length}/5 fotos - Toca para añadir
        </span>
      </div>

      <div className="swap-money-section">
        <h3>Diferencia en dinero</h3>
        <div className="swap-money-direction">
          <button
            type="button"
            className={`swap-direction-btn ${moneyDirection === 'none' ? 'active' : ''}`}
            onClick={() => setMoneyDirection('none')}
          >
            Sin diferencia
          </button>
          <button
            type="button"
            className={\`swap-direction-btn \${moneyDirection === 'toSeller' ? 'active' : ''}\`}
            onClick={() => setMoneyDirection('toSeller')}
          >
            Dinero a favor del vendedor
          </button>
          <button
            type="button"
            className={\`swap-direction-btn \${moneyDirection === 'toBuyer' ? 'active' : ''}\`}
            onClick={() => setMoneyDirection('toBuyer')}
          >
            Dinero a mi favor
          </button>
        </div>
        {moneyDirection !== 'none' && (
          <div className="swap-money-amount">
            <input
              type="range"
              min="0"
              max={itemPrice * 2}
              value={moneyAmount}
              onChange={(e) => setMoneyAmount(Number(e.target.value))}
              className="swap-money-slider"
            />
            <div className="swap-money-display">
              REF {moneyAmount.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="swap-description-section">
        <h3>Descripción de tu propuesta</h3>
        <textarea
          className="swap-description-input"
          placeholder="Describe el artículo que ofreces, su estado y cualquier detalle importante..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <button type="submit" className="btn primary swap-submit-btn">
        Enviar propuesta
      </button>
    </form>
  );
}

export default SwapProposalForm;