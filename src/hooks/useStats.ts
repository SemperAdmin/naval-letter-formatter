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
        const [docResponse, saveResponse, loadResponse] = await Promise.all([
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/documents'),
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/saves'),
          fetch('https://api.countapi.xyz/get/naval-letter-formatter/loads')
        ]);

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
      }
    };

    loadInitialStats();
  }, []);

  const incrementDocumentCount = async () => {
    try {
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/documents');
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
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/saves');
      const data = await response.json();
      
      setStats(prev => ({ 
        ...prev, 
        lettersSaved: data.value || prev.lettersSaved + 1 
      }));
      
      console.log('Letter saved! New count:', data.value);
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
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/loads');
      const data = await response.json();
      
      setStats(prev => ({ 
        ...prev, 
        lettersLoaded: data.value || prev.lettersLoaded + 1 
      }));
      
      console.log('Letter loaded! New count:', data.value);
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