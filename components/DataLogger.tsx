"use client";
import React from 'react';
import { Download, Trash2, TableProperties } from 'lucide-react';

interface DataLoggerProps {
  headers: string[];
  records: any[][];
  onClear: () => void;
}

export const DataLogger: React.FC<DataLoggerProps> = ({ headers, records, onClear }) => {
  const exportToCSV = () => {
    if (records.length === 0) return;
    
    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    records.forEach(row => {
      csvRows.push(row.map(val => {
        if (typeof val === 'number') {
          return val.toFixed(2);
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','));
    });
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `physics_experiment_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TableProperties size={20} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>实验数据记录表</h3>
        </div>
        
        {records.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={exportToCSV}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Download size={14} />
              导出 CSV
            </button>
            <button 
              onClick={onClear}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <Trash2 size={14} />
              清空表格
            </button>
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <div 
          style={{
            padding: '40px',
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}
        >
          <TableProperties size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: 'var(--text-muted)' }} />
          <p>当前暂无记录数据</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>在右侧调参区或下方控制条点击「记录数据」按钮，可记录当前的实验物理量。</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
          <table className="data-logger-table">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ width: '60px', textAlign: 'center' }}>序号</th>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ transition: 'background-color var(--transition-fast)' }}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{rowIdx + 1}</td>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} style={{ fontFamily: 'var(--font-mono)' }}>
                      {typeof cell === 'number' ? cell.toFixed(2) : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
