#!/bin/bash

# Wildlife Sightings API Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [dev|prod|stop|logs]"
    echo ""
    echo "Commands:"
    echo "  dev   - Start development environment (HTTP, dashboard enabled)"
    echo "  prod  - Start production environment (HTTPS, Let's Encrypt)"
    echo "  stop  - Stop all services"
    echo "  logs  - Show logs for all services"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 prod"
    echo "  $0 logs"
}

check_env_file() {
    local env_file=$1
    if [[ ! -f "$env_file" ]]; then
        echo -e "${RED}Error: $env_file not found!${NC}"
        echo "Please copy .env.example to $env_file and configure it."
        exit 1
    fi
}

start_dev() {
    echo -e "${GREEN}Starting development environment...${NC}"
    check_env_file ".env"
    
    docker compose up -d
    
    echo -e "${GREEN}Development environment started!${NC}"
    echo -e "Audio API: ${YELLOW}http://localhost:8028/api/audio/${NC}"
    echo -e "Image API: ${YELLOW}http://localhost:8028/api/image/${NC}"
    echo -e "Traefik Dashboard: ${YELLOW}http://localhost:8029${NC}"
}

start_prod() {
    echo -e "${GREEN}Starting production environment...${NC}"
    check_env_file ".env.prod"
    
    # Check if domain is configured
    if ! grep -q "DOMAIN=" .env.prod || grep -q "DOMAIN=yourdomain.com" .env.prod; then
        echo -e "${RED}Error: Please configure DOMAIN in .env.prod${NC}"
        exit 1
    fi
    
    if ! grep -q "ACME_EMAIL=" .env.prod || grep -q "ACME_EMAIL=your-email@example.com" .env.prod; then
        echo -e "${RED}Error: Please configure ACME_EMAIL in .env.prod${NC}"
        exit 1
    fi
    
    # Create letsencrypt directory if it doesn't exist
    mkdir -p letsencrypt

    # Build images
    docker compose build

    # Stop any running services
    docker compose down
    
    # Start production services
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
    
    echo -e "${GREEN}Production environment started!${NC}"
    echo -e "Audio API: ${YELLOW}https://$(grep DOMAIN .env.prod | cut -d'=' -f2)/api/audio/${NC}"
    echo -e "Image API: ${YELLOW}https://$(grep DOMAIN .env.prod | cut -d'=' -f2)/api/image/${NC}"
    echo -e "${YELLOW}Note: Let's Encrypt certificates may take a few minutes to generate${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose down
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || true
    echo -e "${GREEN}All services stopped${NC}"
}

show_logs() {
    echo -e "${GREEN}Showing logs for all services...${NC}"
    docker compose logs -f
}

case "${1:-}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    *)
        print_usage
        exit 1
        ;;
esac
