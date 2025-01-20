\<!-- @format -->

# Setup SSL certificate

## 1. Update package list

```bash
sudo apt update
```

## 2. Install Nginx, Certbot and Nginx plugin

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/default
```

Example basic API config:

```nginx
server {
    listen 80;
    server_name api.gshub.pro;

    location / {
        proxy_pass http://127.0.0.1:8080; # API backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 4. Test and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Obtain an SSL Certificate

```bash
sudo certbot --nginx
```

## 6. Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```
