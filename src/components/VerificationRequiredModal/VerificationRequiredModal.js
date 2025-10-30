import React from "react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import styled from "styled-components";

const Container = styled.div`
  text-align: center;
  padding: 1rem;
`;

const Icon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ffc107;
`;

const Title = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const VerificationRequiredModal = ({
  isOpen,
  onClose,
  onStartVerification,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <Container>
        <Icon>🔒</Icon>
        <Title>Verificación requerida</Title>
        <Message>
          Para enviar mensajes y proponer intercambios, necesitas verificar tu
          identidad. Esto ayuda a mantener la plataforma segura para todos los
          usuarios.
        </Message>
        <Actions>
          <Button variant="secondary" onClick={onClose}>
            Entendido
          </Button>
          <Button variant="primary" onClick={onStartVerification}>
            Verificar identidad
          </Button>
        </Actions>
      </Container>
    </Modal>
  );
};

export default VerificationRequiredModal;
