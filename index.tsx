// ✅ UNREGISTER Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log("✅ Service Worker unregistered");
    });
  });
}