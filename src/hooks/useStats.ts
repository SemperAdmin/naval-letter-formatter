// src/hooks/useStats.ts
import { useState, useEffect } from 'react';

interface UseStatsReturn {
  incrementDocumentCount: () => Promise<void>;
  incrementSaveCount: () => Promise<void>;
  incrementLoadCount: () => Promise<void>;
  stats: {
    documentsGenerated: number;
    lettersSaved: number;
    lettersLoaded: number;
  };
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState({
    documentsGenerated: 0,
    lettersSaved: 0,
    lettersLoaded: 0
  });

  // Load initial stats on component mount
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for initial load
        
        const [docResponse, saveResponse, loadResponse] = await Promise.all([
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/documents', {
            signal: controller.signal,
            mode: 'cors'
          }),
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/saves', {
            signal: controller.signal,
            mode: 'cors'
          }),
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/loads', {
            signal: controller.signal,
            mode: 'cors'
          })
        ]);
        
        clearTimeout(timeoutId);

        const [docData, saveData, loadData] = await Promise.all([
          docResponse.json(),
          saveResponse.json(),
          loadResponse.json()
        ]);

        setStats({
          documentsGenerated: docData.value || 0,
          lettersSaved: saveData.value || 0,
          lettersLoaded: loadData.value || 0
        });
      } catch (error) {
        console.error('Failed to load initial stats:', error);
        // Use default values on error
        setStats({
          documentsGenerated: 0,
          lettersSaved: 0,
          lettersLoaded: 0
        });
      }
    };

    loadInitialStats();
  }, []);

  const incrementDocumentCount = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/documents', {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      setStats(prev => ({ 
        ...prev, 
        documentsGenerated: data.value || prev.documentsGenerated + 1 
      }));
      
      // Also call global function if it exists (for StatsDisplay component)
      if (typeof window !== 'undefined' && (window as any).updateStatsDisplay) {
        (window as any).updateStatsDisplay();
      }
      
      console.log('Document generated! New count:', data.value);
    } catch (error) {
      console.error('Failed to increment document count:', error);
      // Fallback: increment locally
      setStats(prev => ({ 
        ...prev, 
        documentsGenerated: prev.documentsGenerated + 1 
      }));
    }
  };

  const incrementSaveCount = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/saves', {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      setStats(prev => ({ 
        ...prev, 
        lettersSaved: data.value || prev.lettersSaved + 1 
      }));
      
      // Document count updated successfully
    } catch (error) {
      console.error('Failed to increment save count:', error);
      // Fallback: increment locally
      setStats(prev => ({ 
        ...prev, 
        lettersSaved: prev.lettersSaved + 1 
      }));
    }
  };

  const incrementLoadCount = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/loads', {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      setStats(prev => ({ 
        ...prev, 
        lettersLoaded: data.value || prev.lettersLoaded + 1 
      }));
      
      // Letter loaded count updated successfully
    } catch (error) {
      console.error('Failed to increment load count:', error);
      // Fallback: increment locally
      setStats(prev => ({ 
        ...prev, 
        lettersLoaded: prev.lettersLoaded + 1 
      }));
    }
  };

  return {
    incrementDocumentCount,
    incrementSaveCount,
    incrementLoadCount,
    stats
  };
}