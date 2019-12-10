FROM node:8

# Create app directory inside container
RUN mkdir -p /src
WORKDIR /src

# Include server source and public folder assuming it contains compiled client bundle.
COPY . .

RUN npm install

ENV PORT 5000
EXPOSE ${PORT}

CMD ["npm", "start"]
CMD node app.js