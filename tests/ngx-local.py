# Turn deploy/nginx.example.conf (+ snippets) into a local, unprivileged nginx config for tests:
# plain http on 127.0.0.1:8088, static root = the test build, API on 127.0.0.1:18795, plus a "third-party" site.
import sys, os
W = sys.argv[1]; P = 8088; D = os.path.join(os.path.dirname(__file__), '..', 'deploy')
hosts = ['editor.example.com', 'run.example.com', 'old.example.com']
s = open(os.path.join(D, 'nginx.example.conf')).read()
s = s.replace('listen [::]:443 ssl http2;\n', '').replace('listen 443 ssl http2;', f'listen 127.0.0.1:{P};')
for h in hosts: s = s.replace(f'https://{h}', f'http://{h}:{P}')
s = s.replace('/etc/nginx/snippets', f'{W}/snippets').replace('/var/www/blocks', f'{W}/www')
os.makedirs(f'{W}/snippets', exist_ok=True); os.makedirs(f'{W}/logs', exist_ok=True); os.makedirs(f'{W}/third', exist_ok=True)
for f in ['kindlr-common-headers.conf', 'kindlr-noframe-headers.conf', 'kindlr-proxy.conf']:
    t = open(os.path.join(D, f)).read().replace('127.0.0.1:8795', '127.0.0.1:18795')
    for h in hosts: t = t.replace(f'https://{h}', f'http://{h}:{P}')
    open(f'{W}/snippets/{f}', 'w').write(t)
open(f'{W}/nginx.conf', 'w').write(f'''pid {W}/nginx.pid; error_log {W}/logs/error.log; worker_processes 1;
events {{ worker_connections 512; }}
http {{ include /etc/nginx/mime.types; access_log {W}/logs/access.log;
  client_body_temp_path {W}/t1; proxy_temp_path {W}/t2; fastcgi_temp_path {W}/t3; uwsgi_temp_path {W}/t4; scgi_temp_path {W}/t5;
  limit_req_zone $binary_remote_addr zone=blocks_auth:10m rate=60r/m;
  limit_req_zone $binary_remote_addr zone=blocks_api:10m rate=100r/s;
{s}
server {{ listen 127.0.0.1:{P}; server_name thirdparty.test; root {W}/third; location / {{ try_files $uri =404; }} }}
}}''')
