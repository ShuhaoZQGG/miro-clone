terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.21"
    }
  }
  
  backend "s3" {
    bucket = "miro-clone-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Providers
provider "aws" {
  region = var.aws_region
}

provider "vercel" {
  api_token = var.vercel_token
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "vercel_token" {
  sensitive = true
}

variable "database_password" {
  sensitive = true
}

# VPC for RDS
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = {
    Name = "miro-clone-${var.environment}-vpc"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "private_a" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "miro-clone-${var.environment}-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "miro-clone-${var.environment}-private-b"
  }
}

# RDS Database
resource "aws_db_subnet_group" "main" {
  name = "miro-clone-${var.environment}"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  
  tags = {
    Name = "miro-clone-${var.environment}-db-subnet"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "miro-clone-${var.environment}"
  
  engine = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage = 20
  storage_type = "gp3"
  storage_encrypted = true
  
  db_name = "miro_clone_prod"
  username = "miro_admin"
  password = var.database_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "miro-clone-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD", timestamp())}"
  
  tags = {
    Name = "miro-clone-${var.environment}-database"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "miro-clone-${var.environment}-rds-"
  vpc_id = aws_vpc.main.id
  
  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "miro-clone-${var.environment}-rds-sg"
  }
}

# S3 Bucket for uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "miro-clone-${var.environment}-uploads"
  
  tags = {
    Name = "miro-clone-${var.environment}-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = true
  is_ipv6_enabled = true
  comment = "miro-clone-${var.environment}"
  default_root_object = "index.html"
  
  origin {
    domain_name = "miro-clone.vercel.app"
    origin_id = "vercel"
    
    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }
  
  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id = "s3-uploads"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.uploads.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "vercel"
    
    forwarded_values {
      query_string = true
      headers = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl = 0
    default_ttl = 86400
    max_ttl = 31536000
    compress = true
  }
  
  ordered_cache_behavior {
    path_pattern = "/uploads/*"
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "s3-uploads"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl = 0
    default_ttl = 86400
    max_ttl = 31536000
    compress = true
  }
  
  price_class = "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name = "miro-clone-${var.environment}-cdn"
    Environment = var.environment
  }
}

resource "aws_cloudfront_origin_access_identity" "uploads" {
  comment = "miro-clone-${var.environment}-uploads"
}

# Outputs
output "database_endpoint" {
  value = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = aws_s3_bucket.uploads.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "vpc_id" {
  value = aws_vpc.main.id
}