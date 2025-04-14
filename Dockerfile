# Use the official Golang image as a build stage
FROM golang:alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /app



# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go build -o main ./app

# Start a new stage from scratch
FROM alpine:latest


RUN addgroup -S dndshop && adduser -S dndshop -G dndshop


RUN mkdir -p /app

# Copy the Pre-built binary file from the previous stage with proper permissions
COPY --from=builder --chown=dndshop:dndshop /app/main /app/main

# Labels
LABEL org.opencontainers.image.authors="Sveken"
LABEL org.opencontainers.image.title="OverrideDNDShop"
LABEL org.opencontainers.image.source=https://github.com/sveken/OverrideDNDShop
LABEL org.opencontainers.image.description="A DM Tool for Item Management for Stores. Written for Override."
LABEL org.opencontainers.image.licenses="MIT"

# Switch to non-root user
USER dndshop

# Command to run the executable
CMD ["/app/main"]