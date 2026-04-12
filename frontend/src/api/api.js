import { useStore } from '../store/useStore';

const API_BASE = 'http://localhost:5001';

export const startHardwarePolling = () => {
  setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        const prevState = useStore.getState().hardwareState.mode;
        
        useStore.getState().setHardwareState(data);
        
        if (prevState !== data.mode) {
          useStore.getState().addLog(`System Auth: ${data.mode}`);
        }
      }
    } catch (err) {
      useStore.getState().setHardwareState({ espStatus: 'OFFLINE' });
    }
  }, 500);
};

export const updateEyesState = async (eyesOpen, durationSec) => {
  try {
    await fetch(`${API_BASE}/eyes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eyes_open: eyesOpen,
        eye_closed_duration: durationSec
      })
    });
  } catch (err) {
    console.error('Failed to post eye data');
  }
};

export const updateHardwareState = async (updates) => {
  // Deprecated in new architecture, ESP32 posts to /data natively!
};
