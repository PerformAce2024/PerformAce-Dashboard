document.querySelector('#sendButton').addEventListener('click', async function () {
  const message = document.querySelector('#messageInput').value;
  console.log("Message is:", message);

  try {
    const response = await fetch('http://backend-api.performacemedia.int:8000/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (data.message) {
      alert('Email sent successfully!');
    } else {
      alert('Failed to send email');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});
