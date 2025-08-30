// src/components/StatsDisplay.tsx
"use client"

import { useState, useEffect } from 'react';

interface Stats {
  totalViews: number;
  documentsGenerated: number;
  marinesHelped: number;
  lastUpdate: string;
  isLoading: boolean;
}

interface StatsDisplayProps {
  onDocumentGenerated?: () => void;
}

export function StatsDisplay({ onDocumentGenerated }: StatsDisplayProps) {
  const [stats, setStats] = useState<Stats>({
    totalViews: 0,
    documentsGenerated: 0,
    marinesHelped: 0,
    lastUpdate: '',
    isLoading: true
  });

  const fetchStats = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Increment page view
      const viewResponse = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/views', {
        signal: controller.signal,
        mode: 'cors'
      });
      
      // Get document generation count
      const docResponse = await fetch('https://api.countapi.xyz/get/naval-letter-formatter/documents', {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      const viewData = await viewResponse.json();
      const docData = await docResponse.json();
      
      const totalViews = viewData.value || 0;
      const documentsGenerated = docData.value || 0;
      const marinesHelped = Math.floor(totalViews * 0.7); // Estimate 70% are actual Marines
      
      setStats({
        totalViews,
        documentsGenerated,
        marinesHelped,
        lastUpdate: new Date().toLocaleDateString(),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const incrementDocumentCount = async () => {
    try {
      const response = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/documents');
      const data = await response.json();
      setStats(prev => ({
        ...prev,
        documentsGenerated: data.value || prev.documentsGenerated + 1
      }));
    } catch (error) {
      console.error('Failed to update document count:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Expose increment function to parent
  useEffect(() => {
    if (onDocumentGenerated) {
      // Store the increment function globally so it can be called from document generation
      (window as any).incrementDocumentCount = incrementDocumentCount;
    }
  }, [onDocumentGenerated]);

  if (stats.isLoading) {
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginTop: '15px',
        flexWrap: 'wrap'
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'linear-gradient(45deg, #e9ecef, #dee2e6)',
            color: '#6c757d',
            padding: '8px 14px',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: 'bold',
            opacity: 0.6,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
            Loading...
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes countUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        .stat-badge {
          animation: countUp 0.6s ease-out;
          transition: all 0.3s ease;
        }
        .stat-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginTop: '15px',
        flexWrap: 'wrap'
      }}>
        {/* Total Views */}
        <div className="stat-badge" style={{
          background: 'linear-gradient(135deg, #b8860b, #ffd700)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '18px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 3px 8px rgba(184, 134, 11, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <i className="fas fa-eye" style={{ marginRight: '8px', fontSize: '12px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>
            {stats.totalViews.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.9, marginLeft: '4px' }}>views</span>
        </div>
        
        {/* Documents Generated */}
        <div className="stat-badge" style={{
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '18px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <i className="fas fa-file-word" style={{ marginRight: '8px', fontSize: '12px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>
            {stats.documentsGenerated.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.9, marginLeft: '4px' }}>letters</span>
        </div>
        
        {/* Marines Helped */}
        <div className="stat-badge" style={{
          background: 'linear-gradient(135deg, #dc3545, #c82333)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '18px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 3px 8px rgba(220, 53, 69, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <i className="fas fa-users" style={{ marginRight: '8px', fontSize: '12px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>
            {stats.marinesHelped.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.9, marginLeft: '4px' }}>Marines</span>
        </div>
      </div>
      
      {/* Last Updated Timestamp */}
      <div style={{
        textAlign: 'center',
        marginTop: '8px',
        fontSize: '11px',
        color: '#6c757d',
        opacity: 0.8
      }}>
        <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
        Updated: {stats.lastUpdate}
      </div>
    </>
  );
}