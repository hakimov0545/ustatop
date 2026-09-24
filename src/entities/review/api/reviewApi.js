import { request,jsonBody } from '../../../shared/api/client.js';
export const submitReview=(orderId,review)=>request(`/api/orders/${orderId}/reviews`,{method:'POST',body:jsonBody(review)});
