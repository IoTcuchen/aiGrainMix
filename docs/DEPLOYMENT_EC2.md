# EC2 배포 가이드

## 1. 구성

- `web`: Next.js 서버 (`npm run start`)
- `agent`: FastAPI (`uvicorn api.index:app`)
- `Nginx`: 80/443 TLS 종료 및 reverse proxy

## 2. 권장 포트

- web: `127.0.0.1:3000`
- agent: `127.0.0.1:8000`

## 3. Systemd 예시

### web.service

```ini
[Unit]
Description=aiGrainMix web
After=network.target

[Service]
WorkingDirectory=/opt/aiGrainMix/web
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### agent.service

```ini
[Unit]
Description=aiGrainMix agent
After=network.target

[Service]
WorkingDirectory=/opt/aiGrainMix/agent
ExecStart=/opt/aiGrainMix/agent/.venv/bin/uvicorn api.index:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 4. Nginx 예시

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 5. 배포 순서

1. `git pull`
2. `web`: `npm ci && npm run build`
3. `agent`: `pip install -r requirements.txt`
4. `systemctl restart web agent`
5. `systemctl status web agent`
