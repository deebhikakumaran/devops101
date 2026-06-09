# devops 101: a patience game 🧘‍♀️

the ultimate cheat sheet for surviving deployment without losing your mind. going from a basic local express server to a fully automated, containerized, ssl-secured app on the cloud.

## phase 1: the localhost illusion

you think it works? cute. localhost is just a reserved keyword.

```
curl http://localhost:8000
curl http://127.0.0.1:8000
```

are the exact same thing.

### the fake domain trick

```
sudo vim /etc/hosts
```

mapped tapwho.com to 127.0.0.1.

now `curl http://tapwho.com:8000` works locally.

**reality check:** to let other people see it, you actually need a public IP, a real domain, and a VPS.

## phase 2: the cloud era (excloud + namecheap)

bought the domain on namecheap. got the VPS and IP on excloud. now we have to talk to the machine.

### 1. generate ssh keys locally:

```bash
ssh-keygen -t ed25519 -C "deebhikakumaran@gmail.com"
cd ~/.ssh
cat id_ed25519.pub # copy this!
```

### 2. put the key on the excloud remote machine:

```
vim ~/.ssh/authorized_keys -> paste the public key.
```

add a security group in the excloud dashboard to allow SSH (port 22).

### 3. enter the matrix:

```bash
ssh ubuntu@210.79.129.134
```

say yes to the fingerprint warning. boom. `whoami -> ubuntu`.

## phase 3: the "please don't crash" setup (nvm + pm2)

fetching the code and making it run, even when i close the terminal.

### 1. get the code:

```bash
sudo apt update
git clone https://github.com/deebhikakumaran/devops101.git
cd devops101
```

### 2. node setup (the linux way):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 24
npm i
```

### 3. pm2 to keep it alive:

opening port 8000 in excloud security groups so `http://210.79.129.134:8000/` actually loads.

```bash
npm i pm2 -g
pm2 start index.js
pm2 list
```

it survives session termination. but manually doing `git pull` and `pm2 restart 0` every time i push code? absolutely not.

## phase 4: the automation arc ✨ (github actions)

making github do the heavy lifting.

### 1. the key exchange:

generate a new key on my machine just for github:

```bash
ssh-keygen -t ed25519 -C "github-server@deebhikakumaran" -f private-key
```

add the private key to github secrets (PRIVATE_KEY).

add the public key to the remote machine's authorized_keys.

### 2. the .github/workflows/deploy.yml drop:

wrote a workflow that uses appleboy/ssh-action@v1.0.3 to ssh in, git pull, npm install, and pm2 restart 0.

## phase 5: container chaos 💀 (enter docker)

pm2 is fine, but for heavy file transfers and zero "it works on my machine" drama, we need docker.

### 1. the basic dockerfile:

```dockerfile
FROM node:24-alpine
COPY package.json package-lock.json ./
RUN npm install
COPY index.js .
CMD ["node", "index"]
```

### 2. manual hub push (just to test):

```bash
docker build -t deebhika/devops101:initial .
docker push deebhika/devops101:initial
```

### 3. killing pm2 & prepping the server:

```bash
pm2 stop 0
```

ran the massive block of commands to properly install docker on ubuntu.

### 4. upgrading the CI/CD pipeline:

changed deploy.yml to:

- login to docker hub (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN).
- build and push the image automatically.
- ssh into excloud, pull the new image, and run it:

```bash
sudo docker rm -f devops101 || true
sudo docker pull deebhika/devops101:initial
sudo docker run -d --name devops101 --restart unless-stopped -p 8000:8000 deebhika/devops101:initial
sudo docker image prune -f
```

## phase 6: the final boss (caddy + ssl)

we mapped tapwho.com to 210.79.129.134. changed the container to port 80. but we need a reverse proxy and the green HTTPS lock because it's 2026.

### 1. docker-compose.yml setup:

spins up 5 replicas of the node app, sitting safely behind an internal network.

```yaml
services:
  nodejs-server:
    image: deebhika/devops101:initial
    deploy:
      replicas: 5
    networks:
      - tapwho-internal
  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    networks:
      - tapwho-internal

networks:
  tapwho-internal:
    driver: bridge
```

### 2. the Caddyfile (the MVP for auto-SSL):

caddy listens on 80/443 and passes traffic to the nodejs servers on 8000.

```
tapwho.com {
    tls deebhikakumaran@gmail.com
    reverse_proxy nodejs-server:8000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### 3. the final pipeline update:

updated deploy.yml to use compose.

```bash
sudo docker compose down
sudo docker pull deebhika/devops101:initial
sudo docker compose up -d --force-recreate
sudo docker image prune -f
```

**don't forget:** open port 443 in the excloud security group. pipeline green. ssl secured. 5 hours of figuring it out later, we are live. 🥲