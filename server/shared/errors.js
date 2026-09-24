export function httpError(status,message) { const error=new Error(message);error.status=status;throw error; }

export function errorHandler(error,_req,res,_next) {
  const status=Number(error.status)||500;
  if(status>=500)console.error(error);
  res.status(status).json({error:status>=500?'Serverda xatolik yuz berdi.':error.message});
}
