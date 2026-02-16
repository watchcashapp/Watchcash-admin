# Deployment Guide

This project uses GitHub Actions for CI/CD and Docker for containerization.

## Prerequisites

1. EC2 server with Docker and Docker Compose installed
2. Git repository configured on EC2 server
3. GitHub repository with secrets configured

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### For Development:
- `EC2_HOST_DEV`: EC2 server hostname or IP for development
- `EC2_USERNAME`: SSH username (usually `ec2-user` or `ubuntu`)
- `EC2_SSH_KEY`: Private SSH key for EC2 access
- `EC2_PORT`: SSH port (default: 22, optional)
- `EC2_APP_PATH`: Application path on EC2 (default: `/var/www/watchcash-admin`, optional)

### For Production:
- `EC2_HOST_PROD`: EC2 server hostname or IP for production
- `EC2_USERNAME`: SSH username (usually `ec2-user` or `ubuntu`)
- `EC2_SSH_KEY`: Private SSH key for EC2 access
- `EC2_PORT`: SSH port (default: 22, optional)
- `EC2_APP_PATH`: Application path on EC2 (default: `/var/www/watchcash-admin`, optional)

## EC2 Server Setup

1. Install Docker and Docker Compose:
```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# For Amazon Linux
sudo yum install -y docker
sudo service docker start
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Clone the repository:
```bash
sudo mkdir -p /var/www/watchcash-admin
sudo chown $USER:$USER /var/www/watchcash-admin
cd /var/www/watchcash-admin
git clone <your-repo-url> .
```

3. Ensure the EC2 user can run Docker without sudo:
```bash
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect
```

## Deployment

### Automatic Deployment

- **Development**: Push to `development` or `dev` branch triggers automatic deployment
- **Production**: Push to `main` or `master` branch triggers automatic deployment

### Manual Deployment

You can also trigger deployments manually from GitHub Actions tab.

## Local Development with Docker

### Development Environment:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production Environment (local testing):
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Troubleshooting

1. **SSH Connection Issues**: Verify SSH key and EC2 security group settings
2. **Docker Build Fails**: Check Dockerfile and ensure all dependencies are available
3. **Container Won't Start**: Check logs with `docker-compose logs frontend`
4. **Port Already in Use**: Change port mapping in docker-compose files

