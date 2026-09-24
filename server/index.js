import app from './app.js';
import { closeDatabase } from './db/index.js';

const server=app.listen(Number(process.env.PORT||4000),process.env.HOST||'0.0.0.0',()=>{
  const address=server.address();
  console.log(`UstaTop API running on port ${typeof address==='object'&&address?address.port:process.env.PORT||4000}`);
});
server.on('error',error=>{console.error(`UstaTop API failed to start: ${error.message}`);closeDatabase();process.exitCode=1;});
function shutdown(){server.close(()=>{closeDatabase();process.exit(0);});}
process.on('SIGINT',shutdown);
process.on('SIGTERM',shutdown);
