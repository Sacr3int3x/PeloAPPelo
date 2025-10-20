import React from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card/Card";

function FavsPage() {
  const data = useData();
  const favItems = data?.favItems || [];

  return (
    <main className="container page">
      <h1 className="h1">Favoritos</h1>
      {!favItems.length && <p className="muted">Aún no tienes favoritos.</p>}
      <div className="grid-cards">
        {favItems.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}

export default FavsPage;
