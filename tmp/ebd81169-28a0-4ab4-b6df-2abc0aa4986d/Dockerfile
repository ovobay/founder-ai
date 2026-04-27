FROM node:18-alpine

WORKDIR /app

# Copy all generated files into container
COPY . .

# Install dependencies
RUN npm install

# Expose Next.js port
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev"]