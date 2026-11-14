import { useCallback, useEffect, useState } from 'react';
import { request } from '../api/workflows.js';

/** No pricing cache, refresh on tab focus and every 10 seconds. */
export default function usePricingPolicy() {
  const [pricing,setPricing]=useState(null);
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    try {const fresh=await request('/api/pricing'); setPricing(fresh); setError('');return fresh;}
    catch {setError('Không tải được bảng giá từ máy chủ. Vui lòng thử lại.');return null;}
  },[]);
  useEffect(()=>{
    refresh();
    const onFocus=()=>refresh();
    window.addEventListener('focus',onFocus);
    const timer=setInterval(refresh,10000);
    return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus);};
  },[refresh]);
  return {pricing,error,refresh};
}
