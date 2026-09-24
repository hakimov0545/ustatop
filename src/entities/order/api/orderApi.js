import { request,jsonBody } from '../../../shared/api/client.js';
export const getOrders=()=>request('/api/orders');
export const getIncomingOrders=()=>request('/api/orders/incoming');
export const createOrder=data=>request('/api/orders',{method:'POST',body:jsonBody(data)});
export const changeOrderStatus=(id,status)=>request(`/api/orders/${id}/status`,{method:'PATCH',body:jsonBody({status})});
export const getOrder=id=>request(`/api/orders/${id}`);
