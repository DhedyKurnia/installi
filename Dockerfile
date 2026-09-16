FROM decolua/9router:latest

ENV PORT=20128
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

EXPOSE 20128
