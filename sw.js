self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.notification.body,
    icon: data.notification.icon || '/default-icon.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.notification.title, options)
  );
});
