import { requireUser } from './auth.js';
export function authenticated(req,_res,next){try{requireUser(req);next();}catch(error){next(error);}}
export function roleRequired(role){return(req,_res,next)=>{try{requireUser(req,role);next();}catch(error){next(error);}};}
