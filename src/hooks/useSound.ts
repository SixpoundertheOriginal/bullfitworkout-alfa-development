
import { useRef, useCallback } from 'react';

export const useSound = (soundUrl: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(soundUrl);
      }
      
      // If the audio is already playing, reset it
      if (audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }
      
      const playPromise = audioRef.current.play();
      
      // Handle the play promise to avoid uncaught promise errors
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Audio play failed:", error);
        });
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [soundUrl]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, stop };
};
