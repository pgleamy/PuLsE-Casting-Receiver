/**
 * PuLsE Visualization Receiver
 * Adapted from googlecast/CastReceiver
 */
const context = cast.framework.CastReceiverContext.getInstance();
const player = context.getPlayerManager();
const playbackConfig = new cast.framework.PlaybackConfig();
const videoElement = document.getElementById('media');
const messageElement = document.getElementById('message');
const PULSE_NAMESPACE = 'urn:x-cast:com.pulse';

console.log('PuLsE Receiver: Starting Receiver Manager');

// Configure playback settings (best practice)
player.setPlaybackConfig(playbackConfig);

// Validate PuLsE streams
player.setMessageInterceptor(
  cast.framework.messages.MessageType.LOAD,
  request => {
    console.log('PuLsE Receiver: Intercepting LOAD request', request);
    try {
      if (request.media.customData && request.media.customData.app === 'PuLsE') {
        videoElement.src = request.media.contentId;
        messageElement.textContent = '';
        console.log('PuLsE Receiver: Valid PuLsE stream loaded');
        return request;
      } else {
        console.error('PuLsE Receiver: Invalid stream source');
        messageElement.textContent = 'Error: Stream not from PuLsE Music Visualizer';
        context.stop();
        return null;
      }
    } catch (error) {
      console.error('PuLsE Receiver: Error processing LOAD request', error);
      messageElement.textContent = 'Error: Failed to process stream';
      context.stop();
      return null;
    }
  }
);

// Handle resolution queries
context.addCustomMessageListener(PULSE_NAMESPACE, event => {
  console.log('PuLsE Receiver: Custom message received', event);
  try {
    if (event.data.type === 'GET_RESOLUTION') {
      const logicalWidth = window.screen.width;
      const logicalHeight = window.screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      const response = {
        type: 'RESOLUTION_RESPONSE',
        width: Math.round(logicalWidth * pixelRatio),
        height: Math.round(logicalHeight * pixelRatio),
        aspectRatio: (logicalWidth * pixelRatio) / (logicalHeight * pixelRatio)
      };
      context.sendCustomMessage(PULSE_NAMESPACE, null, response);
      console.log('PuLsE Receiver: Sent resolution', response);
    }
  } catch (error) {
    console.error('PuLsE Receiver: Error handling custom message', error);
    messageElement.textContent = 'Error: Failed to process resolution query';
  }
});

// Error handling (best practice)
player.addEventListener(
  cast.framework.PlayerManagerEventType.ERROR,
  event => {
    console.error('PuLsE Receiver: Playback error', event);
    messageElement.textContent = `Playback error: ${event.errorCode}`;
    context.stop();
  }
);

// Start the receiver
try {
  context.start({ playbackConfig });
  console.log('PuLsE Receiver: Started successfully');
} catch (error) {
  console.error('PuLsE Receiver: Failed to start', error);
  messageElement.textContent = 'Error: Receiver failed to start';
}