# Fix PATCH CORS on production (nginx)

Your curl test proved nginx answers OPTIONS **without PATCH**:

```
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

Node `server.mjs` cannot fix this until nginx is updated.

## Find nginx config

```bash
grep -r "Access-Control-Allow-Methods" /etc/nginx/ 2>/dev/null
grep -r "4443" /etc/nginx/ 2>/dev/null
```

Or in cPanel: **Domains → intelliworkz.digital → nginx configuration**

## Change this line

From:

```
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
```

To:

```
add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
```

If you use an `if ($request_method = OPTIONS)` block, update **that** block too.

## Reload nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Verify

```bash
curl -i -X OPTIONS "https://intelliworkz.digital:4443/api/followups/2/status" \
  -H "Origin: https://intelliworkz.digital" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Response must include **PATCH** in `Access-Control-Allow-Methods`.

## Workaround (no nginx access)

Deploy updated **`api/routes/followups.js`** and **`api/routes/tasks.js`** (POST aliases) plus a **new frontend build** that uses `POST` instead of `PATCH` for status/complete/reschedule. POST is already allowed by nginx CORS.

## Restart API after deploy

```bash
cd /home/crm/public_html/api
pm2 restart crm-api
```
