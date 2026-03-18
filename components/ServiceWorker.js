import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

const ServiceWorker = () => {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  // This component doesn't render anything visible
  return null;
};

const styles = StyleSheet.create({
  // No styles needed as this component doesn't render anything
});

export default ServiceWorker; 