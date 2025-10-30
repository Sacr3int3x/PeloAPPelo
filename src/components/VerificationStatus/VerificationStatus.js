import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import VerificationModal from "../VerificationModal";
import Button from "../Button/Button";
import { toast } from "react-toastify";

const VerificationContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  color: #1a1a1a;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
    switch (props.$status) {
      case "approved":
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case "pending":
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case "rejected":
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #383d41;
          border: 1px solid #d6d8db;
        `;
    }
  }}
`;

const StatusMessage = styled.div`
  margin-bottom: 1rem;
`;

const MessageTitle = styled.h4`
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const MessageText = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const ActionButton = styled(Button)`
  margin-top: 1rem;
`;

const VerificationIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 0.5rem;

  ${(props) => {
    switch (props.$status) {
      case "approved":
        return 'color: #28a745; &:before { content: "✓"; }';
      case "pending":
        return 'color: #ffc107; &:before { content: "⏳"; }';
      case "rejected":
        return 'color: #dc3545; &:before { content: "✗"; }';
      default:
        return 'color: #6c757d; &:before { content: "○"; }';
    }
  }}
`;

const StatusContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StatusText = styled.div`
  flex: 1;
`;

const getStatusConfig = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Verificado",
        title: "¡Identidad Verificada!",
        message:
          "Tu identidad ha sido verificada correctamente. Ahora puedes publicar artículos e intercambiar sin restricciones.",
        canVerify: false,
      };
    case "pending":
      return {
        label: "Pendiente",
        title: "Verificación en Proceso",
        message:
          "Tus documentos han sido enviados y están siendo revisados. Te notificaremos cuando se complete el proceso (24-48 horas).",
        canVerify: false,
      };
    case "rejected":
      return {
        label: "Rechazado",
        title: "Verificación Rechazada",
        message:
          "Tus documentos no pudieron ser verificados. Revisa los requisitos y vuelve a intentarlo con fotos más claras.",
        canVerify: true,
      };
    default:
      return {
        label: "No Verificado",
        title: "Verificación Requerida",
        message:
          "Para publicar artículos e intercambiar, necesitas verificar tu identidad. El proceso es rápido y seguro.",
        canVerify: true,
      };
  }
};

const VerificationStatus = () => {
  const { user, token, refresh, loading: authLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadVerificationStatus = useCallback(async () => {
    if (!token) {
      console.log("No token available, using user data fallback");
      setVerificationStatus({
        verificationStatus: user?.verificationStatus || "unverified",
        verificationRequestedAt: user?.verificationRequestedAt,
        verificationCompletedAt: user?.verificationCompletedAt,
      });
      setLoading(false);
      return;
    }

    try {
      console.log(
        "Loading verification status with token:",
        token ? "present" : "missing",
      );
      const response = await apiRequest("/verification/status", { token });
      setVerificationStatus(response);
    } catch (error) {
      console.error("Error loading verification status:", error);
      // Si hay error, usar el estado del usuario
      setVerificationStatus({
        verificationStatus: user?.verificationStatus || "unverified",
        verificationRequestedAt: user?.verificationRequestedAt,
        verificationCompletedAt: user?.verificationCompletedAt,
      });
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading && user) {
      loadVerificationStatus();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [loadVerificationStatus, authLoading, user]);

  const handleVerificationSuccess = async () => {
    await loadVerificationStatus();
    await refresh(); // Actualizar datos del usuario
    toast.success("¡Verificación enviada correctamente!");
  };

  if (loading) {
    return (
      <VerificationContainer>
        <div>Cargando estado de verificación...</div>
      </VerificationContainer>
    );
  }

  const status = verificationStatus?.verificationStatus || "unverified";
  const config = getStatusConfig(status);

  return (
    <>
      <VerificationContainer>
        <Header>
          <Title>Verificación de Identidad</Title>
          <StatusBadge $status={status}>{config.label}</StatusBadge>
        </Header>

        <StatusContent>
          <VerificationIcon $status={status} />
          <StatusText>
            <StatusMessage>
              <MessageTitle>{config.title}</MessageTitle>
              <MessageText>{config.message}</MessageText>
            </StatusMessage>

            {config.canVerify && (
              <ActionButton
                variant="primary"
                onClick={() => setShowModal(true)}
              >
                Verificar Identidad
              </ActionButton>
            )}
          </StatusText>
        </StatusContent>
      </VerificationContainer>

      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
};

export default VerificationStatus;
