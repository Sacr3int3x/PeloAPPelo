import React from "react";
import { MdSync } from "react-icons/md";

function LoadingPage() {
  return (
    <main className="container page center">
      <MdSync size={32} className="spin" />
    </main>
  );
}

export default LoadingPage;
