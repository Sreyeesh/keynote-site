# Serve the static site via Nginx (small + fast)
FROM nginx:alpine

# Copy site files (now from root instead of public/)
COPY . /usr/share/nginx/html

# Replace default server config with our secure/static-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Optional: drop a healthcheck HTML to verify container is up
RUN printf 'OK\n' > /usr/share/nginx/html/health.txt
