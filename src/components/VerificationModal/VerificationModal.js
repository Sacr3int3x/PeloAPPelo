import React, { useState, useRef } from "react";
import styled from "styled-components";
import { apiRequest } from "../../services/api";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const VerificationModalContainer = styled.div`
  max-width: 600px;
  width: 100%;
  padding: 2rem;
`;

const Title = styled.h2`
  color: #1a1a1a;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;

const Description = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  text-align: center;
`;

const RequirementsList = styled.ul`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid #007bff;
`;

const RequirementItem = styled.li`
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;

  &:before {
    content: "✓";
    color: #28a745;
    font-weight: bold;
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const DocumentCard = styled.div`
  border: 2px dashed ${(props) => (props.$hasImage ? "#28a745" : "#dee2e6")};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(props) => (props.$hasImage ? "#f8fff8" : "#fafafa")};
  position: relative;

  &:hover {
    border-color: #007bff;
    background: #f8f9ff;
  }
`;

const DocumentIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${(props) => (props.$hasImage ? "#28a745" : "#6c757d")};
`;

const DocumentTitle = styled.h4`
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const DocumentDescription = styled.p`
  color: #666;
  font-size: 0.8rem;
  margin: 0;
`;

const HiddenFileInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const VerificationModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState({
    id_front: null,
    id_back: null,
    selfie: null,
  });

  const fileInputs = {
    id_front: useRef(null),
    id_back: useRef(null),
    selfie: useRef(null),
  };

  const documentConfig = {
    id_front: {
      title: "Frente del Documento",
      description: "Foto clara del frente de tu cédula o pasaporte",
      icon: "📄",
    },
    id_back: {
      title: "Reverso del Documento",
      description: "Foto clara del reverso de tu cédula o pasaporte",
      icon: "📄",
    },
    selfie: {
      title: "Selfie con Documento",
      description: "Foto tuya sosteniendo el documento junto a tu rostro",
      icon: "📷",
    },
  };

  const handleFileSelect = (documentType) => {
    fileInputs[documentType].current?.click();
  };

  const handleFileChange = (documentType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar los 5MB");
        return;
      }

      setDocuments((prev) => ({
        ...prev,
        [documentType]: file,
      }));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    // Verificar que todos los documentos estén seleccionados
    const missingDocs = Object.entries(documents)
      .filter(([_, file]) => !file)
      .map(([type, _]) => documentConfig[type].title);

    if (missingDocs.length > 0) {
      toast.error(
        `Faltan los siguientes documentos: ${missingDocs.join(", ")}`,
      );
      return;
    }

    setLoading(true);

    try {
      // Convertir archivos a base64
      const documentData = {};
      for (const [type, file] of Object.entries(documents)) {
        documentData[type] = await convertToBase64(file);
      }

      // Enviar al backend
      const response = await apiRequest("/verification/submit", {
        method: "POST",
        data: documentData,
        token,
      });

      toast.success(response.message || "Documentos enviados correctamente");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error(error.message || "Error al enviar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const allDocumentsSelected = Object.values(documents).every(
    (doc) => doc !== null,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <VerificationModalContainer>
        <Title>Verificación de Identidad</Title>

        <Description>
          Para garantizar la seguridad de la comunidad, necesitamos verificar tu
          identidad. Sube fotos claras de tu documento de identidad y una
          selfie.
        </Description>

        <RequirementsList>
          <RequirementItem>Documento debe estar vigente</RequirementItem>
          <RequirementItem>Fotos nítidas y bien iluminadas</RequirementItem>
          <RequirementItem>
            Información del documento debe ser legible
          </RequirementItem>
          <RequirementItem>
            Selfie debe mostrar claramente tu rostro y el documento
          </RequirementItem>
        </RequirementsList>

        <DocumentGrid>
          {Object.entries(documentConfig).map(([type, config]) => (
            <DocumentCard
              key={type}
              $hasImage={documents[type] !== null}
              onClick={() => handleFileSelect(type)}
            >
              <HiddenFileInput
                ref={fileInputs[type]}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(type, e)}
              />

              {documents[type] ? (
                <PreviewImage
                  src={URL.createObjectURL(documents[type])}
                  alt={config.title}
                />
              ) : (
                <DocumentIcon $hasImage={documents[type] !== null}>
                  {config.icon}
                </DocumentIcon>
              )}

              <DocumentTitle>{config.title}</DocumentTitle>
              <DocumentDescription>{config.description}</DocumentDescription>
            </DocumentCard>
          ))}
        </DocumentGrid>

        <ActionsContainer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!allDocumentsSelected || loading}
          >
            {loading ? (
              <>
                <LoadingSpinner /> Enviando...
              </>
            ) : (
              "Enviar para Verificación"
            )}
          </Button>
        </ActionsContainer>
      </VerificationModalContainer>
    </Modal>
  );
};

export default VerificationModal;
