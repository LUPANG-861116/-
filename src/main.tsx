import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 一次性清除先前測試期間產生的單字進度、星號收藏與舊快取，確保進入純淨全新狀態
if (typeof window !== 'undefined') {
  if (localStorage.getItem('nihongo_clean_launch_v1') !== 'ready') {
    localStorage.removeItem('nihongo_srs_records_v2');
    localStorage.removeItem('nihongo_srs_user_stats_v2');
    localStorage.removeItem('nihongo_favorites_v1');
    localStorage.removeItem('nihongo_reading_progress_v1');
    localStorage.removeItem('nihongo_srs_data_v1');
    localStorage.removeItem('nihongo_user_stats_v1');
    localStorage.setItem('nihongo_clean_launch_v1', 'ready');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
