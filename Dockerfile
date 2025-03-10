# Use the official Golang image as a build stage
FROM golang:alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
#COPY go.mod .
#COPY go.sum .

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
#RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go build -o main .

# Start a new stage from scratch
FROM alpine:latest

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main /app/main


# Labels
LABEL org.opencontainers.image.authors="Sveken"
LABEL org.opencontainers.image.title="OverrideDNDShop"
LABEL org.opencontainers.image.source=https://github.com/sveken/OverrideDNDShop
LABEL org.opencontainers.image.description="A DM Tool for Item Management for Stores. Written for Override."
LABEL org.opencontainers.image.licenses="MIT"

# Command to run the executable
CMD ["/app/main"]