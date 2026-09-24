import { request } from '../../../shared/api/client.js';
import { uploadMedia } from '../../../shared/lib/upload.js';
export const getMasters=filters=>{const query=new URLSearchParams(Object.entries(filters||{}).filter(([,value])=>value!==''&&value!=null));return request(`/api/masters?${query}`);};
export const getMasterProfile=id=>request(`/api/masters/${id}`);
export const updateMasterProfile=data=>request('/api/masters/me/profile',{method:'PATCH',body:JSON.stringify(data)});
export const uploadPortfolio=async(file,caption,userId)=>{const media=await uploadMedia(file,{userId,context:'portfolio'});return request('/api/masters/me/portfolio',{method:'POST',body:JSON.stringify({file:media,caption})});};
export const deletePortfolio=id=>request(`/api/masters/me/portfolio/${id}`,{method:'DELETE'});
