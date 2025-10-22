export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showNotification(title, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: "/logo192.png",
      badge: "/logo192.png",
      ...options,
    });

    notification.onclick = function () {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
    };

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notification.close(), 5000);
  } catch (error) {
    console.error("Error mostrando notificación:", error);
  }
}
