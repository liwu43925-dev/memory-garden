import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const name=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
    let file=resolve(root,name);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return}
    try {if(!(await stat(file)).isFile())throw new Error('not file')}
    catch {if(/^\/r\/[^/]+\/(space|workspace)\//.test(pathname))file=resolve(root,'index.html');else{res.writeHead(404).end('Not found');return}}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(data);
  } catch {res.writeHead(500).end('Server error')}
});
const preferredPort=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
server.on('error',error=>{
  if(error.code==='EADDRINUSE'&&preferredPort!==0)server.listen(0,host);
  else{console.error(error);process.exitCode=1}
});
server.on('listening',()=>console.log(`Memory Garden preview: http://${host==='0.0.0.0'?'<本机局域网IP>':host}:${server.address().port}/`));
server.listen(preferredPort,host);

