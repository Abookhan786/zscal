terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "ap-south-1"
}

resource "aws_vpc" "ztx_vpc" {
  cidr_block           = "10.100.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "zerotrustx-production-vpc"
    Environment = "production"
  }
}

resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.ztx_vpc.id
  cidr_block        = "10.100.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "ztx-private-app-subnet-a"
  }
}

resource "aws_security_group" "connector_sg" {
  name        = "ztx-connector-sg"
  description = "Security group for outbound-only ZeroTrustX App Connectors"
  vpc_id      = aws_vpc.ztx_vpc.id

  # Connectors ONLY initiate OUTBOUND connections
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ztx-app-connector-sg"
  }
}
